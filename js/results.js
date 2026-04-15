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
        const poll = resolvePollForResults();
        if (!poll) {
            renderNoResultsState();
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

    function resolvePollForResults() {
        let poll = null;

        if (pollIdFromUrl) {
            poll = storage.getPollById(pollIdFromUrl);
            if (poll) {
                return poll;
            }
        }

        // Fallback for direct navigation to result.html without pollId.
        const allPolls = storage.getPolls();
        if (!allPolls.length) {
            showAlert('info', 'No polls available yet. Create or vote in a poll to view results.');
            return null;
        }

        const sortedPolls = allPolls.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        poll = sortedPolls[0];
        pollIdFromUrl = poll.id;

        const url = new URL(window.location.href);
        url.searchParams.set('pollId', String(poll.id));
        window.history.replaceState({}, '', url.toString());

        showAlert('info', 'Showing the latest poll results.');
        return poll;
    }

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

        createBarChart(labels, data, colors);

        createPieChart(labels, data, colors);

        updateResultKpis(poll);
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
                    label: 'Responses',
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: '#1f2f43'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' responses';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#43586f'
                        },
                        grid: {
                            color: 'rgba(67, 88, 111, 0.08)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#43586f'
                        },
                        grid: {
                            color: 'rgba(67, 88, 111, 0.14)'
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
                                return context.label + ': ' + context.parsed + ' responses (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    function updateResultKpis(poll) {
        const totalVotes = poll.totalVotes || poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        const kpiTotalVotes = document.getElementById('kpiTotalVotes');
        const kpiTotalOptions = document.getElementById('kpiTotalOptions');
        const kpiResponseModel = document.getElementById('kpiResponseModel');

        if (kpiTotalVotes) kpiTotalVotes.textContent = totalVotes;
        if (kpiTotalOptions) kpiTotalOptions.textContent = poll.options.length;
        if (kpiResponseModel) kpiResponseModel.textContent = poll.optionType === 'checkbox' ? 'Multiple Choice' : 'Single Choice';
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
                        <span>${option.votes} responses (${percentage}%)</span>
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
            <strong>Total Responses:</strong> ${totalVotes}<br>
            <strong>Response Model:</strong> ${poll.optionType === 'checkbox' ? 'Multiple selections allowed' : 'Single selection per response'}
        `;
        detailsContainer.appendChild(summary);
    }

    function renderNoResultsState() {
        const titleEl = document.getElementById('resultTitle');
        const kpiTotalVotes = document.getElementById('kpiTotalVotes');
        const kpiTotalOptions = document.getElementById('kpiTotalOptions');
        const kpiResponseModel = document.getElementById('kpiResponseModel');
        const resultsContainer = document.querySelector('.results-container');
        const detailsContainer = document.getElementById('resultDetails');

        if (titleEl) {
            titleEl.textContent = 'Poll Insights';
        }
        if (kpiTotalVotes) kpiTotalVotes.textContent = '0';
        if (kpiTotalOptions) kpiTotalOptions.textContent = '0';
        if (kpiResponseModel) kpiResponseModel.textContent = 'N/A';

        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }

        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="no-data">
                    <h3>No result data to display</h3>
                    <p>Create a poll or submit a vote, then open the Results page again.</p>
                </div>
            `;
        }
    }

    // ===== HELPER FUNCTIONS =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
