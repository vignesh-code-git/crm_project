"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./header.module.css";
import {
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiBriefcase,
  HiUser,
  HiCurrencyRupee,
  HiTicket,
  HiPencil,
  HiEnvelope,
  HiPhone,
  HiCalendarDays,
  HiClipboardDocumentCheck,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineQuestionMarkCircle,
  HiOutlineArrowRightOnRectangle
} from "react-icons/hi2";
import { GiHamburgerMenu } from "react-icons/gi";
import { API_BASE_URL } from "@/config/apiConfig";

import NotificationBell from "../notifications/NotificationBell";
import ProfileViewModal from "./ProfileViewModal";

export default function Header({ toggleSidebar }) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const resultListRef = useRef(null);

  const safeResults = Array.isArray(results) ? results : [];
  const flatResults = safeResults.flatMap(group => group.items || []);

  // Group by type for the UI
  const groupedByType = safeResults.reduce((acc, group) => {
    (group.items || []).forEach(item => {
      const typeKeyMap = {
        'lead': 'Leads',
        'company': 'Companies',
        'deal': 'Deals',
        'ticket': 'Tickets',
        'activities': 'Activities'
      };
      const typeKey = typeKeyMap[item.type?.toLowerCase()] || 'Other';
      if (!acc[typeKey]) acc[typeKey] = [];
      acc[typeKey].push(item);
    });
    return acc;
  }, {});

  const typeOrder = ["Leads", "Companies", "Deals", "Tickets", "Activities"];
  const finalGroups = typeOrder
    .filter(type => groupedByType[type])
    .map(type => ({ type, items: groupedByType[type] || [] }));

  // 🔥 Fetch logged user
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/profile`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("User fetch error", err));
  }, []);

  // 🔥 Close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 Global Search Logic
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setShowResults(false);
      setActiveIndex(-1);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(searchTerm)}`, {
          credentials: "include",
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (!showResults || flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        handleResultClick(flatResults[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm("");
    setShowSearch(false);
    setActiveIndex(-1);

    const getRoute = (type) => {
      const t = type.toLowerCase().trim();
      if (t === 'company' || t === 'companies') return 'companies';
      if (t === 'lead' || t === 'leads') return 'leads';
      if (t === 'deal' || t === 'deals') return 'deals';
      if (t === 'ticket' || t === 'tickets') return 'tickets';
      return `${t}s`;
    };

    // If it's an 'activities' virtual item, route to parent
    const entityType = result.type === 'activities' ? result.parent_type : (result.type?.toLowerCase() || "");
    const route = getRoute(entityType);
    const id = result.id;

    if (route && id) {
      let url = `/${route}/${id}`;

      // Smart Activity Tab Routing
      if (result.type === 'activities' && result.metadata) {
        const activeTypes = Object.keys(result.metadata);
        if (activeTypes.length === 1) {
          const typeMap = {
            'notes': 'note',
            'emails': 'email',
            'calls': 'call',
            'meetings': 'meeting',
            'tasks': 'task'
          };
          const tab = typeMap[activeTypes[0].toLowerCase()];
          if (tab) url += `?tab=${tab}`;
        } else {
          // If multiple types match (e.g. Note AND Email), go to consolidated timeline
          url += "?tab=activity";
        }
      }

      router.push(url);
    }
  };

  const renderResultContent = (res) => {
    if (res.type === 'activities') {
      return (
        <div className={styles.activityCard}>
          <div className={styles.metadataGrid}>
            {Object.entries(res.metadata || {}).map(([key, val], idx) => (
              <div key={idx} className={styles.metadataRow}>
                <span className={styles.label}>{key.replace(/s$/, '')}:</span>
                <span className={styles.value}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const getTypeIcon = (type) => {
      const t = type?.toLowerCase() || "";
      if (t === 'lead') return <HiUser style={{ color: '#5948DB' }} />;
      if (t === 'company') return <HiBriefcase style={{ color: '#0ea5e9' }} />;
      return null;
    };

    return (
      <>
        <div className={styles.resultItemHeader}>
          <span className={styles.relationshipName}>
            {getTypeIcon(res.type)} {res.relationship_name || res.name}
          </span>
          <span className={styles.clickableType}>{res.type}</span>
        </div>
        <div className={styles.metadataGrid}>
          {/* Priority context: Lead Name first for non-lead entities */}
          {res.type !== 'lead' && res.relationship_name && (
            <div className={styles.metadataRow}>
              <span className={styles.label}>Lead Name:</span>
              <span className={styles.value} style={{ color: '#5948DB', fontWeight: '700' }}>{res.relationship_name}</span>
            </div>
          )}
          {res.name && res.type !== 'lead' && <div className={styles.metadataRow}><span className={styles.label}>Record Name:</span><span className={styles.value}>{res.name}</span></div>}
          {res.email && <div className={styles.metadataRow}><span className={styles.label}>Email:</span><span className={styles.value}>{res.email}</span></div>}

          {/* Expanded Metadata */}
          {res.phone && <div className={styles.metadataRow}><span className={styles.label}>Phone:</span><span className={styles.value}>{res.phone}</span></div>}
          {res.status && <div className={styles.metadataRow}><span className={styles.label}>Status:</span><span className={styles.value}>{res.status}</span></div>}
          {res.industry && <div className={styles.metadataRow}><span className={styles.label}>Industry:</span><span className={styles.value}>{res.industry}</span></div>}
          {res.city && <div className={styles.metadataRow}><span className={styles.label}>Location:</span><span className={styles.value}>{res.city}, {res.country}</span></div>}
          {res.website && <div className={styles.metadataRow}><span className={styles.label}>Website:</span><span className={styles.value} style={{ color: '#0ea5e9' }}>{res.website}</span></div>}
          {res.amount && <div className={styles.metadataRow}><span className={styles.label}>Amount:</span><span className={styles.value}>₹{Number(res.amount).toLocaleString('en-IN')}</span></div>}
          {res.owner_name && <div className={styles.metadataRow}><span className={styles.label}>Owner:</span><span className={styles.value}>{res.owner_name}</span></div>}
        </div>
      </>
    );
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/users/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.hamburger} onClick={toggleSidebar}>
          <GiHamburgerMenu />
        </div>
        <h2 className={styles.logo}>CRM</h2>
      </div>

      <div className={styles.right}>
        {/* Mobile Search Icon */}
        <div className={styles.searchMobile} onClick={() => setShowSearch(true)}>
          <HiOutlineMagnifyingGlass />
        </div>

        {/* Search */}
        <div className={styles.searchDesktop} ref={searchRef}>
          <HiOutlineMagnifyingGlass className={styles.searchIcon} />
          <span className={styles.divider}></span>
          <input
            type="text"
            placeholder="Leads, Companies, Deals, Tickets, Activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
            onKeyDown={handleKeyDown}
          />
          {showResults && (
            <div className={styles.searchResults}>
              {results.length > 0 ? (
                <>
                  <div className={styles.resultList} ref={resultListRef}>
                    {finalGroups.map((group, gIdx) => (
                      <div key={gIdx} className={styles.groupContainer}>
                        <div className={styles.groupHeader}>
                          {group.type}
                        </div>
                        {group.items.map((res, i) => (
                          <div
                            key={i}
                            className={`${styles.resultItem} ${flatResults.indexOf(res) === activeIndex ? styles.activeItem : ""}`}
                            onClick={() => handleResultClick(res)}
                          >
                            {renderResultContent(res)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className={styles.searchFooter}>
                    <div className={styles.shortcutTip}>
                      <span><kbd className={styles.shortcutKbd}>↑↓</kbd> to navigate</span>
                      <span><kbd className={styles.shortcutKbd}>Enter</kbd> to select</span>
                      <span><kbd className={styles.shortcutKbd}>Esc</kbd> to close</span>
                    </div>
                    {isSearching ? <div className={styles.loadingPulse}>Searching...</div> : <div>Click to Navigate to record...</div>}
                  </div>
                </>
              ) : searchTerm.length >= 2 && !isSearching && (
                <div className={styles.noResults}>
                  No records found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Overlay */}
        {showSearch && (
          <div className={styles.mobileSearchBar}>
            <HiOutlineMagnifyingGlass className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
              onKeyDown={handleKeyDown}
            />
            <HiOutlineXMark
              className={styles.closeIcon}
              onClick={() => {
                setShowSearch(false);
                setShowResults(false);
                setSearchTerm("");
              }}
            />
            {showResults && (
              <div className={styles.mobileResults}>
                {results.length > 0 ? (
                  finalGroups.map((group, gIdx) => (
                    <div key={gIdx} className={styles.groupContainer}>
                      <div className={styles.groupHeader}>{group.type}</div>
                      {group.items.map((res, i) => (
                        <div key={i} className={styles.resultItem} onClick={() => handleResultClick(res)}>
                          {renderResultContent(res)}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>No results found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Icons */}
        <div className={styles.iconBox}>
          <NotificationBell />
        </div>

        {/* User Dropdown */}
        <div className={styles.userSection} ref={dropdownRef}>
          <div className={styles.avatar} onClick={() => setShowDropdown(!showDropdown)}>
            {user?.first_name?.[0] || "U"}
          </div>

          {showDropdown && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <strong>{user?.first_name} {user?.last_name}</strong>
                <p>{user?.email}</p>
              </div>
              <div className={styles.dividerLine}></div>
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownItem} onClick={() => { setShowDropdown(false); setIsProfileViewOpen(true); }}>
                  <HiOutlineUser /> My Profile
                </div>
                <div className={styles.dropdownItem} onClick={() => { setShowDropdown(false); router.push("/settings"); }}>
                  <HiOutlineCog6Tooth /> Settings
                </div>
                <div className={styles.dividerLine}></div>
                <div className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  <HiOutlineArrowRightOnRectangle /> Log out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileViewModal
        isOpen={isProfileViewOpen}
        onClose={() => setIsProfileViewOpen(false)}
        user={user}
      />
    </header>
  );
}