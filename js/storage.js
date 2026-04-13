/**
 * Storage.js - Local Storage Management
 * Handles all data persistence using browser localStorage
 */

class StorageManager {
    constructor() {
        this.USERS_KEY = 'votepoll_users';
        this.POLLS_KEY = 'votepoll_polls';
        this.VOTES_KEY = 'votepoll_votes';
        this.CURRENT_USER_KEY = 'votepoll_current_user';
        this.initializeDefaultData();
    }

    // ===== INITIALIZATION =====
    initializeDefaultData() {
        if (!this.getItem(this.USERS_KEY)) {
            // Create demo admin and user accounts
            const demoUsers = [
                { 
                    id: 1, 
                    username: 'admin', 
                    password: 'admin123', 
                    role: 'admin',
                    createdAt: new Date().toISOString()
                },
                { 
                    id: 2, 
                    username: 'user', 
                    password: 'user123', 
                    role: 'user',
                    createdAt: new Date().toISOString()
                }
            ];
            this.setItem(this.USERS_KEY, demoUsers);
        }

        if (!this.getItem(this.POLLS_KEY)) {
            this.setItem(this.POLLS_KEY, []);
        }

        if (!this.getItem(this.VOTES_KEY)) {
            this.setItem(this.VOTES_KEY, []);
        }
    }

    // ===== UTILITY METHODS =====
    getItem(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // ===== USER MANAGEMENT =====
    registerUser(username, password, role = 'user') {
        const users = this.getItem(this.USERS_KEY) || [];
        
        // Check if user already exists
        if (users.some(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        // Create new user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            username: username,
            password: password, // In production, this should be hashed
            role: role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.setItem(this.USERS_KEY, users);
        
        return { success: true, message: 'User registered successfully', user: newUser };
    }

    loginUser(username, password) {
        const users = this.getItem(this.USERS_KEY) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.setItem(this.CURRENT_USER_KEY, user);
            return { success: true, message: 'Login successful', user: user };
        }
        
        return { success: false, message: 'Invalid username or password' };
    }

    getCurrentUser() {
        return this.getItem(this.CURRENT_USER_KEY);
    }

    logoutUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        return true;
    }

    isUserLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    getAllUsers() {
        return this.getItem(this.USERS_KEY) || [];
    }

    // ===== POLL MANAGEMENT =====
    createPoll(question, options, optionType = 'radio', createdBy) {
        const polls = this.getItem(this.POLLS_KEY) || [];
        
        const newPoll = {
            id: polls.length > 0 ? Math.max(...polls.map(p => p.id), 0) + 1 : 1,
            question: question,
            options: options.map((opt, index) => ({
                id: index,
                text: opt,
                votes: 0
            })),
            optionType: optionType,
            createdBy: createdBy,
            createdAt: new Date().toISOString(),
            totalVotes: 0
        };

        polls.push(newPoll);
        this.setItem(this.POLLS_KEY, polls);
        
        return { success: true, message: 'Poll created successfully', poll: newPoll };
    }

    getPolls() {
        return this.getItem(this.POLLS_KEY) || [];
    }

    getPollById(pollId) {
        const polls = this.getItem(this.POLLS_KEY) || [];
        return polls.find(p => p.id === parseInt(pollId));
    }

    deletePoll(pollId) {
        const polls = this.getItem(this.POLLS_KEY) || [];
        const filtered = polls.filter(p => p.id !== parseInt(pollId));
        this.setItem(this.POLLS_KEY, filtered);
        
        // Also delete votes for this poll
        const votes = this.getItem(this.VOTES_KEY) || [];
        const filteredVotes = votes.filter(v => v.pollId !== parseInt(pollId));
        this.setItem(this.VOTES_KEY, filteredVotes);
        
        return true;
    }

    // ===== VOTING MANAGEMENT =====
    submitVote(pollId, selectedOptions, userId) {
        const vote = {
            id: Date.now(),
            pollId: parseInt(pollId),
            userId: userId,
            selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions],
            votedAt: new Date().toISOString()
        };

        const votes = this.getItem(this.VOTES_KEY) || [];
        votes.push(vote);
        this.setItem(this.VOTES_KEY, votes);

        // Update poll vote counts
        const polls = this.getItem(this.POLLS_KEY) || [];
        const poll = polls.find(p => p.id === parseInt(pollId));
        
        if (poll) {
            vote.selectedOptions.forEach(optionId => {
                const option = poll.options.find(o => o.id === parseInt(optionId));
                if (option) {
                    option.votes += 1;
                }
            });
            poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            this.setItem(this.POLLS_KEY, polls);
        }

        return { success: true, message: 'Vote submitted successfully', vote: vote };
    }

    hasUserVoted(pollId, userId) {
        const votes = this.getItem(this.VOTES_KEY) || [];
        return votes.some(v => v.pollId === parseInt(pollId) && v.userId === userId);
    }

    getUserVote(pollId, userId) {
        const votes = this.getItem(this.VOTES_KEY) || [];
        return votes.find(v => v.pollId === parseInt(pollId) && v.userId === userId);
    }

    getPollVotes(pollId) {
        const votes = this.getItem(this.VOTES_KEY) || [];
        return votes.filter(v => v.pollId === parseInt(pollId));
    }

    // ===== STATISTICS =====
    getTotalVotes() {
        const votes = this.getItem(this.VOTES_KEY) || [];
        return votes.length;
    }

    getTotalPolls() {
        const polls = this.getItem(this.POLLS_KEY) || [];
        return polls.length;
    }

    getTotalUsers() {
        const users = this.getItem(this.USERS_KEY) || [];
        return users.length;
    }

    getUserPollsCount(userId) {
        const polls = this.getItem(this.POLLS_KEY) || [];
        return polls.filter(p => p.createdBy === userId).length;
    }

    getUserCreatedPolls(userId) {
        const polls = this.getItem(this.POLLS_KEY) || [];
        return polls.filter(p => p.createdBy === userId);
    }
}

// Create global instance
const storage = new StorageManager();
