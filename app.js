const dataForm = document.getElementById('data-form');
const rfForm = document.getElementById('rf-form');
const treeSelect = document.getElementById('tree-select');
const dataChart = document.getElementById('data-chart');
const rfChart = document.getElementById('rf-chart');
const mseValue = document.getElementById('mse-value');
const quizFeedback = document.getElementById('quiz-feedback');


const quizSection = document.getElementById('quiz');

let currentData = null;
let rfResults = null;
let quizState = 0;

// Quiz questions array
const quizQuestions = [
    {
        question: 'What do you expect will happen if you increase the number of trees (n_estimators)?',
        options: [
            '(a) increase variance',
            '(b) decrease bias',
            '(c) decrease variance',
            '(d) no effect'
        ],
        correct: 'c',
        feedback: {
            c: 'Correct! Increasing n_estimators decreases variance.',
            default: 'Try again!'
        }
    },
    {
        question: 'You increased max_depth and saw training error drop but test error rise. What is this called?',
        options: [
            '(a) Bias',
            '(b) Overfitting',
            '(c) Underfitting'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! This is overfitting.',
            default: 'Try again!'
        }
    },
    {
        question: 'If you increase the noise in the data, what effect does it have on the model\'s predictions?',
        options: [
            '(a) Predictions become more accurate',
            '(b) Predictions become less accurate',
            '(c) No effect',
            '(d) Predictions become smoother'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! More noise makes predictions less accurate.',
            default: 'Try again!'
        }
    },
    {
        question: 'What does the \'max_features\' parameter control in a random forest?',
        options: [
            '(a) The number of trees in the forest',
            '(b) The number of features considered at each split',
            '(c) The maximum depth of each tree',
            '(d) The number of data points used'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! max_features controls the number of features considered at each split.',
            default: 'Try again!'
        }
    },
    {
        question: 'Which scenario is most likely to cause underfitting?',
        options: [
            '(a) Too few trees',
            '(b) Very shallow trees (low max_depth)',
            '(c) High noise in data',
            '(d) Too many features'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! Shallow trees can underfit.',
            default: 'Try again!'
        }
    },
    {
        question: 'Why does a random forest reduce variance compared to a single decision tree?',
        options: [
            '(a) It uses deeper trees',
            '(b) It averages predictions from many trees',
            '(c) It uses more features',
            '(d) It uses less data'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! Averaging many trees reduces variance.',
            default: 'Try again!'
        }
    },
    // Additional questions
    {
        question: 'What is the main advantage of using an ensemble of trees (random forest) over a single decision tree?',
        options: [
            '(a) Faster training',
            '(b) Lower variance and better generalization',
            '(c) More interpretable',
            '(d) Uses less memory'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! Ensembles reduce variance and improve generalization.',
            default: 'Try again!'
        }
    },
    {
        question: 'If you set max_depth to 1 for all trees, what kind of model do you get?',
        options: [
            '(a) Highly complex',
            '(b) Very simple, likely underfitting',
            '(c) Overfitting',
            '(d) No effect'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! Shallow trees underfit.',
            default: 'Try again!'
        }
    },
    {
        question: 'What does increasing the number of trees (n_estimators) do to the random forest\'s predictions?',
        options: [
            '(a) Makes predictions more stable',
            '(b) Increases bias',
            '(c) Makes predictions less stable',
            '(d) No effect'
        ],
        correct: 'a',
        feedback: {
            a: 'Correct! More trees make predictions more stable.',
            default: 'Try again!'
        }
    },
    {
        question: 'Which parameter controls how many features are considered at each split in a tree?',
        options: [
            '(a) n_estimators',
            '(b) max_depth',
            '(c) max_features',
            '(d) noise'
        ],
        correct: 'c',
        feedback: {
            c: 'Correct! max_features controls features per split.',
            default: 'Try again!'
        }
    },
    {
        question: 'If your random forest fits the training data perfectly but performs poorly on new data, what is this called?',
        options: [
            '(a) Underfitting',
            '(b) Overfitting',
            '(c) Good generalization',
            '(d) High bias'
        ],
        correct: 'b',
        feedback: {
            b: 'Correct! This is overfitting.',
            default: 'Try again!'
        }
    }
];
let rfModel = null;

// Utility to plot data using Chart.js
let dataChartInstance = null;
let rfChartInstance = null;

function plotData(x, y) {
    if (dataChartInstance) dataChartInstance.destroy();
    dataChartInstance = new Chart(dataChart, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data',
                data: x.map((xi, i) => ({x: xi, y: y[i]})),
                backgroundColor: '#2980b9',
            }]
        },
        options: {
            scales: { x: { title: { display: true, text: 'X' } }, y: { title: { display: true, text: 'Y' } } }
        }
    });
}

function plotRF(xGrid, yTrue, yPred, trees) {
    if (rfChartInstance) rfChartInstance.destroy();
    let datasets = [
        {
            label: 'Data',
            data: currentData ? currentData.x.map((xi, i) => ({x: xi, y: currentData.y[i]})) : [],
            backgroundColor: '#2980b9',
            type: 'scatter',
            pointRadius: 3,
            showLine: false,
            order: 2
        },
        {
            label: 'True Function',
            data: xGrid.map((xi, i) => ({x: xi, y: yTrue[i]})),
            borderColor: '#27ae60',
            fill: false,
            type: 'line',
            pointRadius: 0,
            borderWidth: 2,
            order: 1
        },
        {
            label: 'Random Forest',
            data: xGrid.map((xi, i) => ({x: xi, y: yPred[i]})),
            borderColor: '#e67e22',
            fill: false,
            type: 'line',
            pointRadius: 0,
            borderWidth: 3,
            order: 0
        }
    ];
    // If a specific tree is selected, only show that tree
    if (trees && trees.length === xGrid.length) {
        datasets = [
            datasets[0], // Data
            datasets[1], // True Function
            {
                label: 'Selected Tree',
                data: xGrid.map((xi, i) => ({x: xi, y: trees[i]})),
                borderColor: '#8e44ad',
                fill: false,
                type: 'line',
                borderDash: [5,5],
                pointRadius: 0,
                borderWidth: 2,
                order: 3
            }
        ];
    }
    rfChartInstance = new Chart(rfChart, {
        type: 'line',
        data: { datasets },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'X' },
                    min: 0,
                    max: 10,
                    ticks: { display: true, stepSize: 1 }
                },
                y: { title: { display: true, text: 'Y' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });
}

// Synthetic data generation
function generateData(numPoints, noise, complexity) {
    let x = [];
    let y = [];
    for (let i = 0; i < numPoints; i++) {
        let xi = i * 10 / (numPoints-1);
        let yi = Math.sin(xi) * complexity + (Math.random()-0.5)*2*noise;
        x.push(xi);
        y.push(yi);
    }
    return {x, y};
}

// Simple random forest simulation
function trainRandomForest(x, y, nEstimators, maxDepth, maxFeatures, complexity) {
    // Use a dense grid for predictions
    const gridSize = 100;
    let xGrid = Array.from({length: gridSize}, (_, i) => i * 10 / (gridSize-1));
    // Fit trees on training data, predict on grid
    let trees = [];
    let yPreds = Array(xGrid.length).fill(0);
    for (let t = 0; t < nEstimators; t++) {
        // Bootstrap sample
        let idxs = Array.from({length: x.length}, (_, i) => i);
        let sampleIdxs = Array.from({length: x.length}, () => idxs[Math.floor(Math.random()*idxs.length)]);
        let xSample = sampleIdxs.map(i => x[i]);
        let ySample = sampleIdxs.map(i => y[i]);
        // Predict on grid
        let treePred = [];
        for (let i = 0; i < xGrid.length; i++) {
            let xi = xGrid[i];
            let bin = Math.floor((xi/10)*maxDepth);
            let binOffset = Math.random() * (10/maxDepth) * 0.5;
            let binStart = bin * (10/maxDepth) + binOffset;
            let binEnd = (bin+1) * (10/maxDepth) + binOffset;
            let binIdxs = xSample.map((xj, j) => (xj >= binStart && xj < binEnd) ? j : -1).filter(j => j !== -1);
            let binYs = binIdxs.map(j => ySample[j]);
            let pred = binYs.length ? binYs.reduce((a,b)=>a+b,0)/binYs.length : 0;
            treePred.push(pred);
        }
        trees.push(treePred);
        for (let i = 0; i < xGrid.length; i++) yPreds[i] += treePred[i]/nEstimators;
    }
    // True function on grid
    let yTrue = xGrid.map(xi => Math.sin(xi)*complexity);
    // MSE on training points
    let mse = y.reduce((acc, yi, i) => acc + Math.pow(yi - yPreds[Math.floor(x[i]/10*(gridSize-1))],2), 0)/y.length;
    return {xGrid, yTrue, yPred: yPreds, trees, mse};
}

// Data generation
dataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const numPoints = +document.getElementById('num-points').value;
    const noise = +document.getElementById('noise').value;
    const complexity = +document.getElementById('complexity').value;
    const data = generateData(numPoints, noise, complexity);
    currentData = {...data, complexity};
    plotData(data.x, data.y);
    rfResults = null;
    mseValue.textContent = '-';
    quizState = 0;
});

// Train RF
rfForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentData) return;
    const nEstimators = +document.getElementById('n-estimators').value;
    const maxDepth = +document.getElementById('max-depth').value;
    const maxFeatures = +document.getElementById('max-features').value;
    const result = trainRandomForest(currentData.x, currentData.y, nEstimators, maxDepth, maxFeatures, currentData.complexity);
    rfResults = result;
    plotRF(result.xGrid, result.yTrue, result.yPred, result.trees.slice(0,3));
    mseValue.textContent = result.mse.toFixed(3);
    quizState = 0;
    updateForestVisualization();
});

function renderTreeSVG(tree, maxDepth) {
    const container = document.getElementById('tree-svg-container');
    container.innerHTML = '';
    if (!tree || !maxDepth || !currentData) return;
    // Build tree structure: each split divides x into bins
    function buildTree(depth, binStart, binEnd, tree, idx) {
        if (depth === maxDepth) {
            // Count data points in this bin
            const count = currentData.x.filter(xi => xi >= binStart && xi < binEnd).length;
            return {type: 'leaf', value: tree[idx], binStart, binEnd, count};
        }
        const split = binStart + (binEnd-binStart)/2;
        const left = buildTree(depth+1, binStart, split, tree, idx);
        const right = buildTree(depth+1, split, binEnd, tree, idx + Math.pow(2, maxDepth-depth-1));
        return {type: 'node', split, left, right, binStart, binEnd};
    }
    const root = buildTree(0, 0, 10, tree, 0);
    // SVG rendering
    const width = 400, height = 180, nodeW = 40, nodeH = 24;
    let svg = `<svg width="${width}" height="${height}">`;
    let levels = [];
    function traverse(node, depth, x, y) {
        if (!levels[depth]) levels[depth] = [];
        levels[depth].push({node, x, y});
        if (node.type === 'node') {
            traverse(node.left, depth+1, x - width/(Math.pow(2,depth+2)), y+50);
            traverse(node.right, depth+1, x + width/(Math.pow(2,depth+2)), y+50);
        }
    }
    traverse(root, 0, width/2, 30);
    // Draw lines
    levels.forEach((level, d) => {
        level.forEach(({node, x, y}) => {
            if (node.type === 'node') {
                let left = levels[d+1].find(n => n.node === node.left);
                let right = levels[d+1].find(n => n.node === node.right);
                if (left) svg += `<line x1='${x}' y1='${y+nodeH}' x2='${left.x}' y2='${left.y}' stroke='#aaa'/>`;
                if (right) svg += `<line x1='${x}' y1='${y+nodeH}' x2='${right.x}' y2='${right.y}' stroke='#aaa'/>`;
            }
        });
    });
    // Draw nodes
    levels.forEach((level, d) => {
        level.forEach(({node, x, y}) => {
            if (node.type === 'node') {
                svg += `<rect x='${x-nodeW/2}' y='${y}' width='${nodeW}' height='${nodeH}' fill='#fff' stroke='#888'/><text x='${x}' y='${y+16}' text-anchor='middle' font-size='12'>x < ${node.split.toFixed(2)}</text>`;
            } else {
                svg += `<rect x='${x-nodeW/2}' y='${y}' width='${nodeW}' height='${nodeH}' fill='#f9e7d3' stroke='#888'/><text x='${x}' y='${y+14}' text-anchor='middle' font-size='12'>${node.value.toFixed(2)}</text><text x='${x}' y='${y+22}' text-anchor='middle' font-size='11' fill='#2980b9'>${node.count} pts</text>`;
            }
        });
    });
    svg += '</svg>';
    container.innerHTML = svg;
}

// Update tree visualization on selection
function updateTreeVisualization() {
    const val = treeSelect.value;
    document.getElementById('tree-svg-container').innerHTML = '';
    if (!rfResults) return;
    if (val.startsWith('tree-')) {
        const idx = parseInt(val.split('-')[1]);
        renderTreeSVG(rfResults.trees[idx], +document.getElementById('max-depth').value);
    }
}

function renderForestSVG(numTrees) {
    const container = document.getElementById('forest-svg-container');
    container.innerHTML = '';
    // Debug info
    let debug = `<div style='color:#c0392b;font-size:12px;'>numTrees: ${numTrees}, rfResults.trees.length: ${rfResults && rfResults.trees ? rfResults.trees.length : 'undefined'}</div>`;
    container.innerHTML = debug;
    if (!rfResults || !numTrees || numTrees < 1) return;
    const width = Math.max(700, numTrees * 120), height = 120;
    let svg = `<svg width='${width}' height='${height}'>`;
    // Root node (ensemble)
    const rootX = width/2, rootY = 30, nodeW = 60, nodeH = 28;
    svg += `<rect x='${rootX-nodeW/2}' y='${rootY}' width='${nodeW}' height='${nodeH}' fill='#e67e22' stroke='#888'/><text x='${rootX}' y='${rootY+18}' text-anchor='middle' font-size='14'>Random Forest</text>`;
    // Child nodes (trees)
    for (let i = 0; i < numTrees; i++) {
        const treeX = 60 + i*100;
        const treeY = rootY+nodeH+30;
        // Line from root to tree
        svg += `<line x1='${rootX}' y1='${rootY+nodeH}' x2='${treeX}' y2='${treeY}' stroke='#aaa'/>`;
        // Simple rectangle for tree
        svg += `<rect x='${treeX-30}' y='${treeY}' width='60' height='28' fill='#fff' stroke='#888'/><text x='${treeX}' y='${treeY+18}' text-anchor='middle' font-size='13'>Tree ${i+1}</text>`;
    }
    svg += '</svg>';
    container.innerHTML = svg;
}

// Update forest visualization on selection
function updateForestVisualization() {
    const container = document.getElementById('forest-svg-container');
    container.innerHTML = '';
    if (!rfResults || !Array.isArray(rfResults.trees) || rfResults.trees.length === 0) {
        container.innerHTML = '<div style="color:#888;padding:1em;">No forest to display. Train a random forest to see the meta tree.</div>';
        return;
    }
    renderForestSVG(rfResults.trees.length);
}

treeSelect.addEventListener('change', () => {
    if (!rfResults) return;
    const val = treeSelect.value;
    if (val === 'forest') {
        plotRF(rfResults.xGrid, rfResults.yTrue, rfResults.yPred, rfResults.trees.slice(0,3));
        document.getElementById('tree-svg-container').innerHTML = '';
        updateForestVisualization();
    } else {
        const idx = parseInt(val.split('-')[1]);
        plotRF(rfResults.xGrid, rfResults.yTrue, rfResults.trees[idx], []);
        renderTreeSVG(rfResults.trees[idx], +document.getElementById('max-depth').value);
        updateForestVisualization();
    }
});

// Quiz logic



function renderQuizList() {
    const quizList = document.getElementById('quiz-list');
    quizList.innerHTML = '';
    quizQuestions.forEach((qObj, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<div><strong>(${idx+1})</strong> ${qObj.question}</div>`;
        const form = document.createElement('form');
        form.id = `quiz-form-${idx}`;
        form.innerHTML = qObj.options.map((opt, optIdx) => {
            const val = String.fromCharCode(97 + optIdx);
            return `<label><input type='radio' name='q${idx}' value='${val}'> ${opt}</label>`;
        }).join('');
        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.textContent = 'Submit Answer';
        form.appendChild(btn);
        const feedback = document.createElement('div');
        feedback.className = 'quiz-feedback';
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = form[`q${idx}`].value;
            if (val === qObj.correct) {
                feedback.textContent = qObj.feedback[val] || 'Correct!';
                feedback.style.color = '#2980b9';
            } else {
                feedback.textContent = qObj.feedback.default || 'Try again!';
                feedback.style.color = '#c0392b';
            }
        });
        li.appendChild(form);
        li.appendChild(feedback);
        quizList.appendChild(li);
    });
}

// Render quiz list on load
renderQuizList();

// Render forest visualization on load if rfResults exist
if (typeof rfResults !== 'undefined' && rfResults && rfResults.trees) {
    updateForestVisualization();
}
