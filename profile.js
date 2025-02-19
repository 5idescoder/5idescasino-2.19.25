document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const tabs = document.querySelectorAll('.game-tab');
    const historyData = document.getElementById('history-data');
    let currentGame = 'fish';

    // Sample betting history data structure
    const bettingHistory = {
        fish: [
            {
                datetime: '2024-01-20 15:30:45',
                startAmount: 1000,
                betAmount: 50,
                winLoss: 150,
                finalAmount: 1150,
                ip: '192.168.1.1'
            }
            // Add more entries as needed
        ],
        plinko: [
            {
                datetime: '2024-01-20 16:15:22',
                startAmount: 1150,
                betAmount: 100,
                winLoss: -100,
                finalAmount: 1050,
                ip: '192.168.1.1'
            }
            // Add more entries as needed
        ]
        // Add other games...
    };

    function updateHistory(game) {
        const history = bettingHistory[game] || [];
        historyData.innerHTML = history.map(entry => `
            <tr>
                <td class="datetime">${entry.datetime}</td>
                <td class="amount">${entry.startAmount}</td>
                <td class="amount">${entry.betAmount}</td>
                <td class="amount ${entry.winLoss >= 0 ? 'positive' : 'negative'}">
                    ${entry.winLoss >= 0 ? '+' : ''}${entry.winLoss}
                </td>
                <td class="amount">${entry.finalAmount}</td>
                <td class="ip-address">${entry.ip}</td>
            </tr>
        `).join('') || '<tr><td colspan="6">No betting history available</td></tr>';
    }

    // Tab click handlers
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentGame = tab.dataset.game;
            updateHistory(currentGame);
        });
    });

    // Initialize with first game's history
    updateHistory(currentGame);
});