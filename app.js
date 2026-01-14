// Simple data storage using localStorage
const STORAGE_KEY = 'teacher_observations';

// Initialize date field to today
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('observation-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    loadObservations();
    updateStudentFilter();
});

// Load observations from localStorage
function loadObservations() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save observations to localStorage
function saveObservations(observations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

// Add new observation
document.getElementById('observation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const studentName = document.getElementById('student-name').value.trim();
    const date = document.getElementById('observation-date').value;
    const type = document.getElementById('observation-type').value;
    const notes = document.getElementById('observation-notes').value.trim();
    
    if (!studentName || !date || !type || !notes) {
        alert('Please fill in all fields.');
        return;
    }
    
    const observations = loadObservations();
    const newObservation = {
        id: Date.now(),
        studentName,
        date,
        type,
        notes,
        timestamp: new Date().toISOString()
    };
    
    observations.push(newObservation);
    saveObservations(observations);
    
    // Reset form
    document.getElementById('observation-form').reset();
    document.getElementById('observation-date').valueAsDate = new Date();
    
    // Refresh display
    displayProgressSheets();
    updateStudentFilter();
    
    // Show feedback
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.backgroundColor = '#16a34a';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
});

// Display progress sheets
function displayProgressSheets() {
    const observations = loadObservations();
    const selectedStudent = document.getElementById('student-filter').value;
    
    // Filter by student if selected
    const filtered = selectedStudent 
        ? observations.filter(obs => obs.studentName === selectedStudent)
        : observations;
    
    // Group by student
    const byStudent = {};
    filtered.forEach(obs => {
        if (!byStudent[obs.studentName]) {
            byStudent[obs.studentName] = [];
        }
        byStudent[obs.studentName].push(obs);
    });
    
    const container = document.getElementById('progress-sheets');
    
    if (Object.keys(byStudent).length === 0) {
        container.innerHTML = '<p class="empty-state">No observations yet. Add your first observation above.</p>';
        return;
    }
    
    // Sort students alphabetically
    const students = Object.keys(byStudent).sort();
    
    container.innerHTML = students.map(studentName => {
        const studentObs = byStudent[studentName].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        return createStudentSheet(studentName, studentObs);
    }).join('');
}

// Create HTML for a student's progress sheet
function createStudentSheet(studentName, observations) {
    // Calculate summary statistics
    const typeCounts = {};
    observations.forEach(obs => {
        typeCounts[obs.type] = (typeCounts[obs.type] || 0) + 1;
    });
    
    const totalObs = observations.length;
    const firstDate = observations[observations.length - 1].date;
    const lastDate = observations[0].date;
    
    const observationsHTML = observations.map(obs => `
        <div class="observation-item">
            <div class="observation-header">
                <span class="observation-type ${obs.type}">${obs.type}</span>
                <span class="observation-date">${formatDate(obs.date)}</span>
            </div>
            <div class="observation-notes">${escapeHtml(obs.notes)}</div>
        </div>
    `).join('');
    
    return `
        <div class="student-sheet" data-student="${escapeHtml(studentName)}">
            <div class="student-header">
                <div>
                    <div class="student-name">${escapeHtml(studentName)}</div>
                    <div class="observation-count">${totalObs} observation${totalObs !== 1 ? 's' : ''} • ${formatDate(firstDate)} to ${formatDate(lastDate)}</div>
                </div>
            </div>
            <div class="observations-list">
                ${observationsHTML}
            </div>
            <div class="summary-section">
                <div class="summary-title">Summary</div>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${totalObs}</div>
                        <div class="stat-label">Total Observations</div>
                    </div>
                    ${Object.entries(typeCounts).map(([type, count]) => `
                        <div class="stat-item">
                            <div class="stat-value">${count}</div>
                            <div class="stat-label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Update student filter dropdown
function updateStudentFilter() {
    const observations = loadObservations();
    const students = [...new Set(observations.map(obs => obs.studentName))].sort();
    const filter = document.getElementById('student-filter');
    
    const currentValue = filter.value;
    filter.innerHTML = '<option value="">All Students</option>' + 
        students.map(student => 
            `<option value="${escapeHtml(student)}">${escapeHtml(student)}</option>`
        ).join('');
    
    // Restore selection if still valid
    if (currentValue && students.includes(currentValue)) {
        filter.value = currentValue;
    }
    
    displayProgressSheets();
}

// Student filter change
document.getElementById('student-filter').addEventListener('change', () => {
    displayProgressSheets();
});

// Print button
document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
});

// Clear all button
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all observations? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        displayProgressSheets();
        updateStudentFilter();
    }
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initial display
displayProgressSheets();

