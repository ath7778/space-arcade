document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    const gardenGrid = document.getElementById('gardenGrid');
    const seedItems = document.querySelectorAll('.seed-item');
    const resourceItems = document.querySelectorAll('.resource-item');
    const toolItems = document.querySelectorAll('.tool-item');
    
    let gameRunning = false;
    let gamePaused = false;
    let currentDay = 1;
    let waterLevel = 100;
    let nutrientLevel = 100;
    let plantsGrown = 0;
    let resourcesHarvested = 0;
    
    const plantTypes = {
        lumina: {
            name: 'Lumina',
            waterNeeded: 25,
            nutrientNeeded: 35,
            waterConsumption: 3,
            nutrientConsumption: 2,
            growthDays: 3,
            resourceValue: 15
        },
        voidbloom: {
            name: 'Voidbloom',
            waterNeeded: 50,
            nutrientNeeded: 30,
            waterConsumption: 5,
            nutrientConsumption: 3,
            growthDays: 4,
            resourceValue: 20
        },
        stellaris: {
            name: 'Stellaris',
            waterNeeded: 40,
            nutrientNeeded: 40,
            waterConsumption: 4,
            nutrientConsumption: 4,
            growthDays: 5,
            resourceValue: 25
        },
        chronosprout: {
            name: 'Chronosprout',
            waterNeeded: 60,
            nutrientNeeded: 60,
            waterConsumption: 6,
            nutrientConsumption: 6,
            growthDays: 2,
            resourceValue: 40
        }
    };
    
    let selectedSeed = 'lumina';
    let selectedTool = 'plant';
    let plots = [];
    
    function updateStats() {
        const livingPlants = plots.filter(plot => plot.plant && !plot.plant.dead).length;
        const totalPlots = plots.length;
        
        document.getElementById('plantsDisplay').innerText = `Plants: ${livingPlants}/${totalPlots}`;
        document.getElementById('waterDisplay').innerText = `Water: ${Math.floor(waterLevel)}%`;
        document.getElementById('nutrientsDisplay').innerText = `Nutrients: ${Math.floor(nutrientLevel)}%`;
    }
    
    function createGarden() {
        gardenGrid.innerHTML = '';
        plots = [];
        
        const gridSize = window.innerWidth < 768 ? (window.innerWidth < 480 ? 4 : 9) : 16;
        const gridColumns = window.innerWidth < 768 ? (window.innerWidth < 480 ? 2 : 3) : 4;
        
        gardenGrid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
        gardenGrid.style.gridTemplateRows = `repeat(${Math.ceil(gridSize / gridColumns)}, 1fr)`;
        
        for (let i = 0; i < gridSize; i++) {
            const plot = document.createElement('div');
            plot.className = 'plot plot-empty';
            plot.dataset.index = i;
            
            const plotContent = document.createElement('div');
            plotContent.className = 'plot-content';
            
            plot.appendChild(plotContent);
            gardenGrid.appendChild(plot);
            
            plots.push({
                element: plot,
                contentElement: plotContent,
                plant: null
            });
            
            plot.addEventListener('click', function() {
                handlePlotClick(i);
            });
        }
    }
    
    function handlePlotClick(index) {
        if (!gameRunning || gamePaused) return;
        
        const plot = plots[index];
        
        if (selectedTool === 'plant') {
            if (!plot.plant) {
                plantSeed(plot, selectedSeed);
            }
        } else if (selectedTool === 'water') {
            if (plot.plant && !plot.plant.dead) {
                waterPlant(plot);
            }
        } else if (selectedTool === 'fertilize') {
            if (plot.plant && !plot.plant.dead) {
                fertilizePlant(plot);
            }
        } else if (selectedTool === 'harvest') {
            if (plot.plant && plot.plant.stage === 3 && !plot.plant.dead) {
                harvestPlant(plot);
            }
        }
        
        updateStats();
    }
    
    function plantSeed(plot, seedType) {
        if (seedType === 'chronosprout' && plantsGrown < 5) {
            return;
        }
        
        const plantData = plantTypes[seedType];
        
        plot.plant = {
            type: seedType,
            waterLevel: 50,
            nutrientLevel: 50,
            age: 0,
            stage: 1,
            dead: false
        };
        
        plot.element.classList.remove('plot-empty');
        
        renderPlant(plot);
    }
    
    function waterPlant(plot) {
        if (waterLevel <= 0) return;
        
        const waterAmount = 20;
        waterLevel -= waterAmount * 0.5;
        
        if (waterLevel < 0) waterLevel = 0;
        
        plot.plant.waterLevel += waterAmount;
        if (plot.plant.waterLevel > 100) {
            plot.plant.waterLevel = 100;
        }
        
        renderPlant(plot);
    }
    
    function fertilizePlant(plot) {
        if (nutrientLevel <= 0) return;
        
        const nutrientAmount = 20;
        nutrientLevel -= nutrientAmount * 0.5;
        
        if (nutrientLevel < 0) nutrientLevel = 0;
        
        plot.plant.nutrientLevel += nutrientAmount;
        if (plot.plant.nutrientLevel > 100) {
            plot.plant.nutrientLevel = 100;
        }
        
        renderPlant(plot);
    }
    
    function harvestPlant(plot) {
        const plantData = plantTypes[plot.plant.type];
        resourcesHarvested += plantData.resourceValue;
        
        waterLevel += plantData.resourceValue * 0.3;
        nutrientLevel += plantData.resourceValue * 0.3;
        
        if (waterLevel > 100) waterLevel = 100;
        if (nutrientLevel > 100) nutrientLevel = 100;
        
        plot.plant = null;
        plot.element.classList.add('plot-empty');
        plot.contentElement.innerHTML = '';
        
        plantsGrown++;
        
        if (plantsGrown >= 5) {
            unlockChronosprout();
        }
    }
    
    function unlockChronosprout() {
        const chronosproutSeed = document.querySelector('.seed-item[data-type="chronosprout"]');
        if (chronosproutSeed) {
            chronosproutSeed.classList.remove('locked');
        }
    }
    
    function renderPlant(plot) {
        const contentElement = plot.contentElement;
        const plant = plot.plant;
        
        if (!plant) {
            contentElement.innerHTML = '';
            return;
        }
        
        contentElement.innerHTML = '';
        
        const plantElement = document.createElement('div');
        plantElement.className = `plant plant-${plant.type} plant-stage-${plant.stage}`;
        
        if (plant.dead) {
            plantElement.classList.add('plant-dead');
        }
        
        const plantGraphic = document.createElement('div');
        plantGraphic.className = 'plant-graphic';
        
        const plantStem = document.createElement('div');
        plantStem.className = 'plant-stem';
        
        const plantLeaves = document.createElement('div');
        plantLeaves.className = 'plant-leaves';
        
        const plantPot = document.createElement('div');
        plantPot.className = 'plant-pot';
        
        const plantStatus = document.createElement('div');
        plantStatus.className = 'plant-status';
        
        const waterIcon = document.createElement('i');
        waterIcon.className = 'fas fa-tint';
        if (plant.waterLevel < 30) {
            waterIcon.classList.add('low');
        }
        
        const nutrientIcon = document.createElement('i');
        nutrientIcon.className = 'fas fa-flask';
        if (plant.nutrientLevel < 30) {
            nutrientIcon.classList.add('low');
        }
        
        plantStatus.appendChild(waterIcon);
        plantStatus.appendChild(nutrientIcon);
        
        plantGraphic.appendChild(plantLeaves);
        plantGraphic.appendChild(plantStem);
        plantGraphic.appendChild(plantPot);
        
        plantElement.appendChild(plantGraphic);
        plantElement.appendChild(plantStatus);
        
        contentElement.appendChild(plantElement);
    }
    
    function updatePlants() {
        let allDead = true;
        
        plots.forEach(plot => {
            if (plot.plant && !plot.plant.dead) {
                const plantData = plantTypes[plot.plant.type];
                
                plot.plant.waterLevel -= plantData.waterConsumption * 0.3;
                plot.plant.nutrientLevel -= plantData.nutrientConsumption * 0.3;
                
                if (plot.plant.waterLevel <= 0 || plot.plant.nutrientLevel <= 0) {
                    plot.plant.dead = true;
                } else {
                    allDead = false;
                    
                    plot.plant.age++;
                    
                    if (plot.plant.age >= plantData.growthDays && plot.plant.stage < 3) {
                        plot.plant.stage++;
                    }
                }
                
                renderPlant(plot);
            }
        });
        
        const livingPlants = plots.filter(plot => plot.plant && !plot.plant.dead).length;
        if (livingPlants === 0 && plots.some(plot => plot.plant)) {
            gameOver();
        }
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        currentDay = 1;
        waterLevel = 100;
        nutrientLevel = 100;
        plantsGrown = 0;
        resourcesHarvested = 0;
        
        selectedSeed = 'lumina';
        selectedTool = 'plant';
        
        seedItems.forEach(item => {
            if (item.dataset.type === 'chronosprout') {
                item.classList.add('locked');
            }
            item.classList.remove('selected');
            if (item.dataset.type === selectedSeed) {
                item.classList.add('selected');
            }
        });
        
        toolItems.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.tool === selectedTool) {
                item.classList.add('selected');
            }
        });
        
        createGarden();
        
        document.getElementById('startScreen').classList.add('hidden');
        
        updateStats();
    }
    
    function endDay() {
        gameRunning = false;
        
        const livingPlants = plots.filter(plot => plot.plant && !plot.plant.dead).length;
        const totalPlants = plots.filter(plot => plot.plant).length;
        
        if (livingPlants === 0 && totalPlants > 0) {
            gameOver();
            return;
        }
        
        const dayResourceGain = calculateDayResourceGain();
        resourcesHarvested += dayResourceGain;
        
        waterLevel += dayResourceGain * 0.1;
        nutrientLevel += dayResourceGain * 0.1;
        
        if (waterLevel > 100) waterLevel = 100;
        if (nutrientLevel > 100) nutrientLevel = 100;
        
        document.getElementById('dayHealthyPlants').innerText = livingPlants;
        document.getElementById('dayResourcesGained').innerText = dayResourceGain;
        
        if (plantsGrown >= 5 && document.querySelector('.seed-item[data-type="chronosprout"].locked')) {
            document.getElementById('dayNewSeeds').innerText = 'Chronosprout';
            unlockChronosprout();
        } else {
            document.getElementById('dayNewSeeds').innerText = 'None';
        }
        
        document.getElementById('dayCompleteScreen').classList.remove('hidden');
    }
    
    function calculateDayResourceGain() {
        let gain = 0;
        
        plots.forEach(plot => {
            if (plot.plant && !plot.plant.dead && plot.plant.stage === 3) {
                const plantData = plantTypes[plot.plant.type];
                gain += plantData.resourceValue * 0.2;
            }
        });
        
        return Math.floor(gain);
    }
    
    function startNextDay() {
        currentDay++;
        gameRunning = true;
        
        updatePlants();
        updateStats();
        
        document.getElementById('dayCompleteScreen').classList.add('hidden');
    }
    
    function gameOver() {
        gameRunning = false;
        
        document.getElementById('finalPlantsGrown').innerText = plantsGrown;
        document.getElementById('finalResourcesHarvested').innerText = resourcesHarvested;
        document.getElementById('finalDaysSurvived').innerText = currentDay;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    function togglePause() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    function toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn.innerHTML.includes('volume-up')) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    function toggleHelp() {
        document.getElementById('helpModal').classList.toggle('hidden');
    }
    
    seedItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!gameRunning || gamePaused) return;
            
            const seedType = this.dataset.type;
            
            if (seedType === 'chronosprout' && this.classList.contains('locked')) {
                return;
            }
            
            selectedSeed = seedType;
            
            seedItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedTool = 'plant';
            toolItems.forEach(t => {
                t.classList.remove('selected');
                if (t.dataset.tool === 'plant') {
                    t.classList.add('selected');
                }
            });
        });
    });
    
    toolItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!gameRunning || gamePaused) return;
            
            selectedTool = this.dataset.tool;
            
            toolItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('pauseScreen').classList.add('hidden');
        startGame();
    });
    document.getElementById('restartGameBtn').addEventListener('click', function() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        startGame();
    });
    document.getElementById('nextDayBtn').addEventListener('click', startNextDay);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', toggleHelp);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    document.getElementById('nextDayBtn').addEventListener('click', startNextDay);
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'p') {
            togglePause();
        } else if (event.key === 'm') {
            toggleMute();
        } else if (event.key === 'h') {
            toggleHelp();
        } else if (event.key === 'n' && document.getElementById('dayCompleteScreen').classList.contains('hidden') === false) {
            startNextDay();
        }
    });
    
    function createStars(container, count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = 5 + Math.random() * 10;
            
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.animationDelay = `${delay}s`;
            star.style.animationDuration = `${duration}s`;
            
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            const opacity = Math.random() * 0.5 + 0.3;
            star.style.opacity = opacity;
            
            container.appendChild(star);
        }
    }
    
    document.getElementById('startBtn').addEventListener('click', function() {
        setTimeout(function() {
            showTooltip('Click on an empty plot to plant a seed!');
        }, 1000);
    });
    
    function showTooltip(message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerText = message;
        tooltip.style.position = 'absolute';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.backgroundColor = 'rgba(0, 40, 100, 0.9)';
        tooltip.style.color = '#ffffff';
        tooltip.style.padding = '10px 20px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.zIndex = '1000';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.animation = 'fadeInOut 3s forwards';
        
        document.querySelector('.game-area').appendChild(tooltip);
        
        setTimeout(function() {
            tooltip.remove();
        }, 3000);
    }
    
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});
