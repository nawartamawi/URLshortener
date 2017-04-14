module.exports = function urlsForUser(urls, userID) {
  const userURLs = {};
  for(let key in urls){
    if (urls[key].userID === userID){
      userURLs[key] = urls[key];
    }
  }
  return userURLs;
};