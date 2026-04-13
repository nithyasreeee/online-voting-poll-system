/**
 * Home.js - Dashboard Logic
 * Displays different content for admin and user roles
 */

(function() {
    'use strict';

    // Check if user is logged in
    if (!Auth.isLoggedIn()) {
        window.location.href = 'index.html';
    }

    const currentUser = Auth.getCurrentUser();

    // ===== PAGE INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    });

    // ===== ADMIN DASHBOARD =====
    function showAdminDashboard() {
        const adminDashboard = document.getElementById('adminDashboard');
        const userDashboard = document.getElementById('userDashboard');
        const createPollLink = document.getElementById('createPollLink');

        if (adminDashboard) adminDashboard.classList.remove('hidden');
        if (userDashboard) userDashboard.classList.add('hidden');
        if (createPollLink) createPollLink.classList.remove('hidden');

        // Load statistics
        loadAdminStats();
        
        // Load admin polls list
        loadAdminPolls();
    }

    function loadAdminStats() {
        const totalPollsEl = document.getElementById('adminTotalPolls');
        const totalVotesEl = document.getElementById('adminTotalVotes');
        const totalUsersEl = document.getElementById('adminTotalUsers');
        const activePollsEl = document.getElementById('adminActivePolls');

        const allPolls = storage.getPolls();
        const adminPolls = allPolls.filter(p => p.createdBy === currentUser.id);
        const totalVotes = storage.getTotalVotes();
        const totalUsers = storage.getTotalUsers();
        const activePolls = adminPolls.filter(p => (p.totalVotes || 0) > 0).length;

        if (totalPollsEl) totalPollsEl.textContent = adminPolls.length;
        if (totalVotesEl) totalVotesEl.textContent = totalVotes;
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (activePollsEl) activePollsEl.textContent = activePolls;
    }

    function loadAdminPolls() {
        const pollsList = document.getElementById('adminPollsList');
        const allPolls = storage.getPolls();
        const adminPolls = allPolls.filter(p => p.createdBy === currentUser.id);

        if (!pollsList) return;

        if (adminPolls.length === 0) {
            pollsList.innerHTML = `
                <div class="no-data">
                    <h3>No Polls Created</h3>
                    <p><a href="poll.html" class="btn btn-primary">Create Your First Poll</a></p>
                </div>
            `;
            return;
        }

        pollsList.innerHTML = adminPolls.map(poll => `
            <div class="poll-card">
                <h3>${escapeHtml(poll.question)}</h3>
                <div class="poll-meta">
                    <span>Responses <strong class="poll-votes">${poll.totalVotes}</strong></span>
                    <span>${poll.options.length} options</span>
                </div>
                <p class="poll-summary">
                    Published ${new Date(poll.createdAt).toLocaleDateString()} • ${poll.optionType === 'checkbox' ? 'Multiple choice' : 'Single choice'}
                </p>
                <div class="poll-actions">
                    <button class="btn btn-primary btn-small" onclick="viewResults(${poll.id})">View Results</button>
                    <button class="btn btn-danger btn-small" onclick="deletePoll(${poll.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // ===== USER DASHBOARD =====
    function showUserDashboard() {
        const adminDashboard = document.getElementById('adminDashboard');
        const userDashboard = document.getElementById('userDashboard');
        const createPollLink = document.getElementById('createPollLink');

        if (adminDashboard) adminDashboard.classList.add('hidden');
        if (userDashboard) userDashboard.classList.remove('hidden');
        if (createPollLink) createPollLink.classList.add('hidden');

        // Load user polls list
        loadUserPolls();
    }

    function loadUserPolls() {
        const pollsList = document.getElementById('userPollsList');
        const noPollsMessage = document.getElementById('noPollsMessage');
        const allPolls = storage.getPolls();

        if (!pollsList) return;

        if (allPolls.length === 0) {
            pollsList.classList.add('hidden');
            if (noPollsMessage) noPollsMessage.classList.remove('hidden');
            return;
        }

        pollsList.classList.remove('hidden');
        if (noPollsMessage) noPollsMessage.classList.add('hidden');

        pollsList.innerHTML = allPolls.map(poll => {
            const hasVoted = storage.hasUserVoted(poll.id, currentUser.id);
            const voteStatus = hasVoted ? '<span style="color: #27ae60; font-weight: 600;">✓ Voted</span>' : '';

            return `
                <div class="poll-card">
                    <h3>${escapeHtml(poll.question)}</h3>
                    <div class="poll-meta">
                        <span>Responses <strong class="poll-votes">${poll.totalVotes}</strong></span>
                        ${voteStatus}
                    </div>
                    <p class="poll-summary">
                        Published ${new Date(poll.createdAt).toLocaleDateString()} • ${poll.optionType === 'checkbox' ? 'Multiple choice' : 'Single choice'}
                    </p>
                    <div class="poll-actions">
                        <button class="btn btn-primary btn-small" onclick="goToVote(${poll.id})">
                            ${hasVoted ? 'View Results' : 'Vote Now'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== HELPER FUNCTIONS =====
    window.goToVote = function(pollId) {
        window.location.href = `poll.html?pollId=${pollId}`;
    };

    window.viewResults = function(pollId) {
        window.location.href = `result.html?pollId=${pollId}`;
    };

    window.deletePoll = function(pollId) {
        if (confirm('Are you sure you want to delete this poll? All votes will be deleted as well.')) {
            storage.deletePoll(pollId);
            showAlert('success', 'Poll deleted successfully');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
