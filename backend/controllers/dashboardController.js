const repo = require("../repositories/dashboardRepository");

exports.getStatusBar = async (req, res) => {
  try {
    const totalLeads = await repo.getTotalLeadsCount();
    const dealsData = await repo.getDealsForStatusBar();

    // ✅ Active Deals (NOT Closed Won / Closed Lost)
    const activeDeals = dealsData.filter(
      d => !["closed won", "closed lost"].includes(
        (d.deal_stage || "").trim().toLowerCase()
      )
    ).length;

    // ✅ Closed Deals (ONLY Closed Won)
    const closedDeals = dealsData.filter(
      d => (d.deal_stage || "").trim().toLowerCase() === "closed won"
    ).length;

    // ✅ Monthly Revenue (Closed Won only)
    const now = new Date();

    const monthlyRevenue = dealsData
      .filter(d => {
        if ((d.deal_stage || "").trim().toLowerCase() !== "closed won") return false;

        // 🔥 FALLBACK: Use created_at if close_date is missing
        const date = new Date(d.close_date || d.created_at);
        return (
          !isNaN(date) &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    res.json({
      total_leads: Number(totalLeads),
      active_deals: activeDeals,
      closed_deals: closedDeals,
      monthly_revenue: monthlyRevenue,
    });

  } catch (err) {
    console.error("STATUSBAR ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDealProgress = async (req, res) => {
  try {
    const data = await repo.getDealStageProgress();

    const totalLeads = Number(data.find(d => d.deal_stage === 'Total Leads')?.count || 0);
    const totalDeals = Number(data.find(d => d.deal_stage === 'Total Deals')?.count || 0);

    const formatted = data
      .filter(d => !['Total Leads', 'Total Deals'].includes(d.deal_stage))
      .map(d => {
        const isDealStage = ["Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"].includes(d.deal_stage);
        const base = isDealStage ? totalDeals : totalLeads;

        return {
          stage: d.deal_stage,
          count: Number(d.count),
          value: base === 0 ? 0 : Number(((Number(d.count) / base) * 100).toFixed(1))
        };
      });

    res.json({
      totalLeads,
      totalDeals,
      items: formatted
    });

  } catch (err) {
    console.error("PROGRESS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const rows = await repo.getSalesReport();

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const data = months.map((month, index) => {
      const found = rows.find(r => Number(r.month_num) === index + 1);

      const won = found ? Number(found.won) : 0;
      const lost = found ? Number(found.lost) : 0;

      return {
        month,
        light: won + lost,
        dark: won,
        lost: lost,
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

exports.getTeamPerformance = async (req, res) => {
  try {
    const usersData = await repo.getAllUsersForPerformance();
    const dealsData = await repo.getAllDealsForPerformance();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(currentMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    // 🔥 Helper for date matching with fallback
    const isSameMonth = (d, targetMonth, targetYear) => {
      const date = new Date(d.close_date || d.created_at);
      return !isNaN(date) && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    };

    const normalize = (d) => (d.deal_stage || "").trim().toLowerCase();

    // 1️⃣ PROCESS ASSIGNED DEALS (PER USER)
    const result = usersData.map(user => {
      const userDeals = dealsData.filter(d => 
        Array.isArray(d.owner_id) && d.owner_id.some(oid => Number(oid) === Number(user.id))
      );

      const closedDeals = userDeals.filter(d => normalize(d) === "closed won");
      
      const active = userDeals.filter(d => !["closed won", "closed lost"].includes(normalize(d))).length;
      const closed = closedDeals.length;
      
      // ✅ Revenue (Total for this user)
      const revenue = closedDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      // ✅ Current vs Last Month for Growth
      const currentRevenue = closedDeals.filter(d => isSameMonth(d, currentMonth, currentYear))
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      const lastRevenue = closedDeals.filter(d => isSameMonth(d, lastMonth, lastYear))
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      let growth = 0;
      if (lastRevenue === 0 && currentRevenue > 0) growth = 100;
      else if (lastRevenue > 0 && currentRevenue === 0) growth = -100;
      else if (lastRevenue > 0) growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;

      return {
        name: `${user.first_name} ${user.last_name}`,
        active,
        closed,
        revenue,
        growth
      };
    });

    res.json(result);

  } catch (err) {
    console.error("TEAM PERFORMANCE ERROR:", err);
    res.status(500).json([]);
  }
};
