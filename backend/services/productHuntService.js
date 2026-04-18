const fetchPosts = async () => {
    const token = process.env.product_hunt_api_token;
    if (!token) throw new Error("product_hunt_api_token missing");

    let allPosts = [];
    let hasNextPage = true;
    let cursor = null;
    let fetchCount = 0;

    // Loop until we hit roughly 1000+ items or run out of pages
    while (hasNextPage && allPosts.length < 1000) {
        const query = `
          query($cursor: String) {
            posts(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  name
                  tagline
                  votesCount
                  url
                  createdAt
                  topics(first: 5) {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query, variables: { cursor } })
        });

        const data = await response.json();
        if (data.errors) {
            console.log("⚠️ API Rate Limit or Error reached. Yielding fetched batch so far.");
            break; // Stop fetching and return what we have!
        }
        
        const posts = data.data?.posts?.edges?.map(e => e.node) || [];
        allPosts = allPosts.concat(posts);
        
        hasNextPage = data.data.posts.pageInfo.hasNextPage;
        cursor = data.data.posts.pageInfo.endCursor;
        fetchCount++;
        
        console.log(`📡 Fetched ${allPosts.length} products so far...`);
    }

    return allPosts;
};

module.exports = { fetchPosts };
