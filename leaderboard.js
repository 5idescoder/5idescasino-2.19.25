document.addEventListener('DOMContentLoaded', () => {
    // Sample leaderboard data (excluding admin)
    const leaderboardData = [
        { username: 'Player1', coins: 5000 },
        { username: 'Player2', coins: 3500 },
        { username: 'Player3', coins: 2000 }
    ];

    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // Sort players by coins (highest to lowest)
    leaderboardData.sort((a, b) => b.coins - a.coins);
    
    // Populate leaderboard
    leaderboardData.forEach((player, index) => {
        const row = document.createElement('tr');
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        
        row.innerHTML = `
            <td class="rank ${rankClass}">#${index + 1}</td>
            <td>${player.username}</td>
            <td>${player.coins.toLocaleString()}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
});