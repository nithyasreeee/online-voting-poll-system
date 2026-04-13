/**
 * Poll.js - Poll Creation and Voting Logic
 * Handles both poll creation (admin) and voting (users)
 */

(function() {
    'use strict';

    // Check if user is logged in
    if (!Auth.isLoggedIn()) {
        window.location.href = 'index.html';
    }

    const currentUser = Auth.getCurrentUser();
    let pollIdFromUrl = parseInt(new URLSearchParams(window.location.search).get('pollId'));

    // ===== PAGE INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        if (pollIdFromUrl) {
            // User is viewing/voting on an existing poll
            loadPollForVoting(pollIdFromUrl);
        } else if (currentUser.role === 'admin') {
            // Admin is creating a new poll
            showCreatePollForm();
        } else {
            // User trying to create poll (not allowed)
            window.location.href = 'home.html';
        }

        setupAddOptionButton();
        setupCreatePollForm();
        setupVoteForm();
    });

    // ===== ADMIN: CREATE POLL SECTION =====
    function showCreatePollForm() {
        const createSection = document.getElementById('createPollSection');
        const voteSection = document.getElementById('votePollSection');
        const alreadyVotedSection = document.getElementById('alreadyVotedSection');

        if (createSection) createSection.classList.remove('hidden');
        if (voteSection) voteSection.classList.add('hidden');
        if (alreadyVotedSection) alreadyVotedSection.classList.add('hidden');
    }

    function setupAddOptionButton() {
        const addBtn = document.getElementById('addOptionBtn');
        if (!addBtn) return;

        addBtn.addEventListener('click', function() {
            const container = document.getElementById('optionInputs');
            if (!container) return;

            const newOption = document.createElement('div');
            newOption.className = 'option-input-group';
            newOption.style.marginBottom = '15px';
            newOption.innerHTML = `
                <input type="text" class="option-input" placeholder="Option ${container.children.length + 1}">
                <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="margin-left: 10px;">Remove</button>
            `;
            container.appendChild(newOption);
        });
    }

    function setupCreatePollForm() {
        const form = document.getElementById('createPollForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const question = document.getElementById('pollQuestion').value.trim();
            const optionType = document.getElementById('optionType').value;
            const optionInputs = document.querySelectorAll('.option-input');
            
            const options = Array.from(optionInputs)
                .map(input => input.value.trim())
                .filter(val => val.length > 0);

            // Validation
            if (!question) {
                showAlert('danger', 'Poll question is required');
                return;
            }

            if (options.length < 2) {
                showAlert('danger', 'Please add at least 2 options');
                return;
            }

            // Create poll
            const result = storage.createPoll(question, options, optionType, currentUser.id);

            if (result.success) {
                showAlert('success', 'Poll created successfully!');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showAlert('danger', result.message);
            }
        });
    }

    // ===== USER: VOTING SECTION =====
    function loadPollForVoting(pollId) {
        const poll = storage.getPollById(pollId);

        if (!poll) {
            showAlert('danger', 'Poll not found');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            return;
        }

        const hasVoted = storage.hasUserVoted(pollId, currentUser.id);

        if (hasVoted) {
            showAlreadyVotedMessage(pollId);
        } else {
            showVoteForm(poll);
        }
    }

    function showVoteForm(poll) {
        const createSection = document.getElementById('createPollSection');
        const voteSection = document.getElementById('votePollSection');
        const alreadyVotedSection = document.getElementById('alreadyVotedSection');

        if (createSection) createSection.classList.add('hidden');
        if (voteSection) voteSection.classList.remove('hidden');
        if (alreadyVotedSection) alreadyVotedSection.classList.add('hidden');

        // Set poll title
        const titleEl = document.getElementById('votePollTitle');
        if (titleEl) titleEl.textContent = poll.question;

        // Render options
        const optionsContainer = document.getElementById('voteOptionsContainer');
        if (!optionsContainer) return;

        optionsContainer.innerHTML = poll.options.map(option => {
            const inputType = poll.optionType === 'radio' ? 'radio' : 'checkbox';
            const inputName = poll.optionType === 'radio' ? 'voteOption' : `option_${option.id}`;

            return `
                <div class="option">
                    <input type="${inputType}" name="${inputName}" value="${option.id}" id="option_${option.id}">
                    <label for="option_${option.id}">${escapeHtml(option.text)}</label>
                </div>
            `;
        }).join('');
    }

    function showAlreadyVotedMessage(pollId) {
        const createSection = document.getElementById('createPollSection');
        const voteSection = document.getElementById('votePollSection');
        const alreadyVotedSection = document.getElementById('alreadyVotedSection');

        if (createSection) createSection.classList.add('hidden');
        if (voteSection) voteSection.classList.add('hidden');
        if (alreadyVotedSection) alreadyVotedSection.classList.remove('hidden');

        const resultsLink = document.getElementById('viewResultsLink');
        if (resultsLink) {
            resultsLink.href = `result.html?pollId=${pollId}`;
        }
    }

    function setupVoteForm() {
        const form = document.getElementById('votePollForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const poll = storage.getPollById(pollIdFromUrl);
            if (!poll) {
                showAlert('danger', 'Poll not found');
                return;
            }

            // Get selected options
            let selectedOptions = [];
            if (poll.optionType === 'radio') {
                const selected = document.querySelector('input[name="voteOption"]:checked');
                if (selected) {
                    selectedOptions.push(selected.value);
                }
            } else {
                const selected = document.querySelectorAll('input[type="checkbox"]:checked');
                selectedOptions = Array.from(selected).map(el => el.value);
            }

            if (selectedOptions.length === 0) {
                showAlert('danger', 'Please select at least one option');
                return;
            }

            // Submit vote
            const result = storage.submitVote(pollIdFromUrl, selectedOptions, currentUser.id);

            if (result.success) {
                showAlert('success', 'Your vote has been submitted!');
                setTimeout(() => {
                    window.location.href = `result.html?pollId=${pollIdFromUrl}`;
                }, 1500);
            } else {
                showAlert('danger', result.message);
            }
        });
    }

    // ===== HELPER FUNCTIONS =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
