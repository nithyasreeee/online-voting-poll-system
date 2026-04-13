/**
 * Results.js - Poll Results Display and Charts
 * Displays poll results with bar charts, pie charts, and detailed statistics
 */

(function() {
    'use strict';

    // Check if user is logged in
    if (!Auth.isLoggedIn()) {
        window.location.href = 'index.html';
    }

    const currentUser = Auth.getCurrentUser();
    let pollIdFromUrl = parseInt(new URLSearchParams(window.location.search).get('pollId'));
    let barChart = null;
    let pieChart = null;

    // ===== PAGE INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        if (!pollIdFromUrl) {
            showAlert('danger', 'Poll not found');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            return;
        }

        const poll = storage.getPollById(pollIdFromUrl);
        if (!poll) {
            showAlert('danger', 'Poll not found');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            return;
        }

        // Display poll title
        const titleEl = document.getElementById('resultTitle');
        if (titleEl) {
            titleEl.textContent = `Results: ${poll.question}`;
        }

        // Render charts and details
        renderCharts(poll);
        renderDetailedResults(poll);
    });

    // ===== RENDER CHARTS =====
    function renderCharts(poll) {
        const labels = poll.options.map(opt => opt.text);
        const data = poll.options.map(opt => opt.votes);
        const colors = [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
            '#34495e',
            '#e67e22'
        ];

        // Bar Chart
        createBarChart(labels, data, colors);

        // Pie Chart
        createPieChart(labels, data, colors);
    }

    function createBarChart(labels, data, colors) {
        const barCanvas = document.getElementById('barChartCanvas');
        if (!barCanvas) return;

        if (barChart) {
            barChart.destroy();
        }

        barChart = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Votes',
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderRadius: 5,
                    hoverBackgroundColor: '#2c3e50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function createPieChart(labels, data, colors) {
        const pieCanvas = document.getElementById('pieChartCanvas');
        if (!pieCanvas) return;

        if (pieChart) {
            pieChart.destroy();
        }

        pieChart = new Chart(pieCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' votes (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // ===== DETAILED RESULTS =====
    function renderDetailedResults(poll) {
        const detailsContainer = document.getElementById('resultDetails');
        if (!detailsContainer) return;

        const totalVotes = poll.totalVotes || poll.options.reduce((sum, opt) => sum + opt.votes, 0);

        detailsContainer.innerHTML = poll.options.map(option => {
            const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
            const barWidth = totalVotes > 0 ? (option.votes / Math.max(...poll.options.map(o => o.votes), 1)) * 100 : 0;

            return `
                <div class="result-item">
                    <div class="result-label">
                        <span>${escapeHtml(option.text)}</span>
                        <span>${option.votes} votes (${percentage}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${barWidth}%">
                            ${barWidth > 5 ? Math.round(barWidth) + '%' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add total votes summary
        const summary = document.createElement('div');
        summary.style.marginTop = '20px';
        summary.style.padding = '15px';
        summary.style.backgroundColor = '#f8f9fa';
        summary.style.borderRadius = '5px';
        summary.style.borderLeft = '4px solid #3498db';
        summary.innerHTML = `
            <strong>Total Votes Cast:</strong> ${totalVotes}<br>
            <strong>Response Rate:</strong> ${poll.optionType === 'checkbox' ? 'Multiple selections allowed' : 'Single selection per vote'}
        `;
        detailsContainer.appendChild(summary);
    }

    // ===== HELPER FUNCTIONS =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
