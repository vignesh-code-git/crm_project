export const formatNotificationTime=(timestamp)=>{

  const now=new Date();
  const date=new Date(timestamp);

  const diffSeconds=
    Math.floor((now-date)/1000);

  const diffMinutes=
    Math.floor(diffSeconds/60);

  if(diffSeconds<60) return"Now";

  if(diffMinutes<60)
    return`${diffMinutes} min ago`;

  return date.toLocaleString();

};