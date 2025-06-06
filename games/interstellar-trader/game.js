document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    const starMap = document.getElementById('starMap');
    const currentLocationIndicator = document.getElementById('currentLocationIndicator');
    
    let gameRunning = false;
    let gamePaused = false;
    let credits = 10000;
    let fuel = 100;
    let currentShip = {
        name: 'Scout',
        cargoCapacity: 100,
        fuelEfficiency: 1.0,
        price: 10000
    };
    let cargoHold = {};
    let currentPlanet = null;
    let selectedPlanet = null;
    let activePlanets = [];
    let currentTransaction = {
        type: 'buy',
        resource: null,
        quantity: 1,
        price: 0
    };
    
    const shipTypes = {
        'Scout': {
            name: 'Scout',
            cargoCapacity: 100,
            fuelEfficiency: 1.0,
            price: 10000,
            icon: 'fa-rocket'
        },
        'Freighter': {
            name: 'Freighter',
            cargoCapacity: 300,
            fuelEfficiency: 0.8,
            price: 50000,
            icon: 'fa-space-shuttle'
        },
        'Cruiser': {
            name: 'Cruiser',
            cargoCapacity: 200,
            fuelEfficiency: 1.2,
            price: 75000,
            icon: 'fa-shuttle-van'
        },
        'Galleon': {
            name: 'Galleon',
            cargoCapacity: 500,
            fuelEfficiency: 0.7,
            price: 150000,
            icon: 'fa-truck'
        },
        'Star Liner': {
            name: 'Star Liner',
            cargoCapacity: 800,
            fuelEfficiency: 0.9,
            price: 300000,
            icon: 'fa-ship'
        }
    };
    
    const resourceTypes = {
        'Minerals': {
            name: 'Minerals',
            basePrice: 100,
            icon: 'fa-gem',
            color: '#c0c0ff'
        },
        'Food': {
            name: 'Food',
            basePrice: 80,
            icon: 'fa-wheat-awn',
            color: '#c0ffc0'
        },
        'Technology': {
            name: 'Technology',
            basePrice: 200,
            icon: 'fa-microchip',
            color: '#ffc0c0'
        },
        'Medicine': {
            name: 'Medicine',
            basePrice: 150,
            icon: 'fa-pills',
            color: '#ffffc0'
        },
        'Luxury Goods': {
            name: 'Luxury Goods',
            basePrice: 300,
            icon: 'fa-gem',
            color: '#ffc0ff'
        },
        'Fuel Cells': {
            name: 'Fuel Cells',
            basePrice: 120,
            icon: 'fa-battery-full',
            color: '#c0ffff'
        },
        'Weapons': {
            name: 'Weapons',
            basePrice: 250,
            icon: 'fa-gun',
            color: '#ff8080'
        },
        'Rare Metals': {
            name: 'Rare Metals',
            basePrice: 400,
            icon: 'fa-ring',
            color: '#e0e0e0'
        }
    };
    
    const planetTypes = [
        'Terrestrial',
        'Gas Giant',
        'Ice World',
        'Desert',
        'Ocean',
        'Volcanic',
        'Rocky',
        'Jungle'
    ];
    
    const economyTypes = [
        'Industrial',
        'Agricultural',
        'Mining',
        'High-Tech',
        'Tourist'
    ];
    
    const planetColors = [
        '#4080ff', // Blue
        '#40ff80', // Green
        '#ff4080', // Red
        '#80ff40', // Light Green
        '#8040ff', // Purple
        '#ff8040', // Orange
        '#40ffff', // Cyan
        '#ffff40', // Yellow
        '#ff40ff', // Magenta
        '#c0c0c0'  // Silver
    ];
    
    function generatePlanets() {
        const numPlanets = 10;
        const planets = [];
        
        const width = starMap.clientWidth;
        const height = starMap.clientHeight;
        
        for (let i = 0; i < numPlanets; i++) {
            const planetType = planetTypes[Math.floor(Math.random() * planetTypes.length)];
            const economyType = economyTypes[Math.floor(Math.random() * economyTypes.length)];
            const color = planetColors[Math.floor(Math.random() * planetColors.length)];
            
            const size = 20 + Math.floor(Math.random() * 30);
            
            let x, y;
            let validPosition = false;
            
            while (!validPosition) {
                x = size + Math.random() * (width - size * 2);
                y = size + Math.random() * (height - size * 2);
                
                validPosition = true;
                
                for (const planet of planets) {
                    const dx = x - planet.x;
                    const dy = y - planet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < size + planet.size + 50) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            const resources = generatePlanetResources(economyType);
            
            planets.push({
                id: i,
                name: generatePlanetName(),
                type: planetType,
                economy: economyType,
                color: color,
                size: size,
                x: x,
                y: y,
                resources: resources
            });
        }
        
        return planets;
    }
    
    function generatePlanetName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
        const suffixes = ['Prime', 'Minor', 'Major', 'Centauri', 'Proxima', 'Nova', 'Ultima', 'Sigma', 'Omega', 'Nexus'];
        const numbers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        
        const usePrefix = Math.random() > 0.5;
        const useSuffix = Math.random() > 0.5;
        const useNumber = Math.random() > 0.5;
        
        let name = '';
        
        if (usePrefix) {
            name += prefixes[Math.floor(Math.random() * prefixes.length)] + ' ';
        }
        
        const baseNames = ['Rigel', 'Vega', 'Antares', 'Sirius', 'Polaris', 'Canopus', 'Arcturus', 'Deneb', 'Altair', 'Capella', 
                        'Betelgeuse', 'Aldebaran', 'Spica', 'Pollux', 'Fomalhaut', 'Castor', 'Regulus', 'Procyon', 'Achernar', 'Hadar'];
        
        name += baseNames[Math.floor(Math.random() * baseNames.length)];
        
        if (useSuffix) {
            name += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
        }
        
        if (useNumber) {
            name += ' ' + numbers[Math.floor(Math.random() * numbers.length)];
        }
        
        return name;
    }
    
    function generatePlanetResources(economyType) {
        const resources = {};
        const resourceNames = Object.keys(resourceTypes);
        
        for (const resourceName of resourceNames) {
            let priceMultiplier = 0.8 + Math.random() * 0.4; // Base random fluctuation
            let availabilityMultiplier = 0.8 + Math.random() * 0.4; // Base random fluctuation
            
            // Apply economy-specific modifiers
            switch (economyType) {
                case 'Industrial':
                    if (resourceName === 'Technology') {
                        priceMultiplier *= 0.7; // Technology is cheaper
                        availabilityMultiplier *= 2.0; // More technology available
                    } else if (resourceName === 'Minerals') {
                        priceMultiplier *= 1.5; // Minerals are more expensive
                        availabilityMultiplier *= 0.5; // Less minerals available
                    }
                    break;
                    
                case 'Agricultural':
                    if (resourceName === 'Food') {
                        priceMultiplier *= 0.6; // Food is cheaper
                        availabilityMultiplier *= 2.5; // More food available
                    } else if (resourceName === 'Technology') {
                        priceMultiplier *= 1.4; // Technology is more expensive
                        availabilityMultiplier *= 0.6; // Less technology available
                    }
                    break;
                    
                case 'Mining':
                    if (resourceName === 'Minerals' || resourceName === 'Rare Metals') {
                        priceMultiplier *= 0.6; // Minerals are cheaper
                        availabilityMultiplier *= 2.5; // More minerals available
                    } else if (resourceName === 'Technology') {
                        priceMultiplier *= 1.3; // Technology is more expensive
                    }
                    break;
                    
                case 'High-Tech':
                    if (resourceName === 'Technology' || resourceName === 'Weapons') {
                        priceMultiplier *= 0.7; // Technology is cheaper
                        availabilityMultiplier *= 2.0; // More technology available
                    } else if (resourceName === 'Minerals' || resourceName === 'Food') {
                        priceMultiplier *= 1.3; // These are more expensive
                    }
                    break;
                    
                case 'Tourist':
                    if (resourceName === 'Luxury Goods' || resourceName === 'Food') {
                        priceMultiplier *= 1.5; // Luxury goods are more expensive
                        availabilityMultiplier *= 0.7; // Less available
                    }
                    break;
            }
            
            const basePrice = resourceTypes[resourceName].basePrice;
            const price = Math.round(basePrice * priceMultiplier);
            
            const baseAvailability = 50 + Math.floor(Math.random() * 150);
            const availability = Math.round(baseAvailability * availabilityMultiplier);
            
            resources[resourceName] = {
                price: price,
                available: availability
            };
        }
        
        return resources;
    }
    
    function renderPlanets() {
        starMap.innerHTML = '';
        
        if (currentPlanet) {
            currentLocationIndicator.style.left = `${currentPlanet.x - 20}px`;
            currentLocationIndicator.style.top = `${currentPlanet.y - 20}px`;
            currentLocationIndicator.style.display = 'block';
        } else {
            currentLocationIndicator.style.display = 'none';
        }
        
        for (const planet of activePlanets) {
            const planetElement = document.createElement('div');
            planetElement.className = 'planet';
            if (selectedPlanet && selectedPlanet.id === planet.id) {
                planetElement.classList.add('selected');
            }
            
            planetElement.style.width = `${planet.size}px`;
            planetElement.style.height = `${planet.size}px`;
            planetElement.style.left = `${planet.x - planet.size / 2}px`;
            planetElement.style.top = `${planet.y - planet.size / 2}px`;
            planetElement.style.backgroundColor = planet.color;
            
            planetElement.dataset.planetId = planet.id;
            
            planetElement.addEventListener('click', function() {
                selectPlanet(planet);
            });
            
            starMap.appendChild(planetElement);
        }
    }
    
    function selectPlanet(planet) {
        selectedPlanet = planet;
        
        document.getElementById('planetName').innerText = planet.name;
        document.getElementById('planetType').innerText = planet.type;
        document.getElementById('planetEconomy').innerText = planet.economy;
        
        const planetImage = document.getElementById('planetImage');
        planetImage.style.backgroundColor = planet.color;
        
        if (currentPlanet) {
            const distance = calculateDistance(currentPlanet, planet);
            document.getElementById('planetDistance').innerText = `${distance.toFixed(1)} light-years`;
            
            const travelCost = calculateTravelCost(distance);
            document.getElementById('travelCost').innerText = `${travelCost} units`;
            
            document.getElementById('travelBtn').disabled = (travelCost > fuel || currentPlanet.id === planet.id);
        } else {
            document.getElementById('planetDistance').innerText = 'N/A';
            document.getElementById('travelCost').innerText = 'N/A';
            document.getElementById('travelBtn').disabled = true;
        }
        
        renderPlanets();
    }
    
    function calculateDistance(planet1, planet2) {
        const dx = planet1.x - planet2.x;
        const dy = planet1.y - planet2.y;
        return Math.sqrt(dx * dx + dy * dy) / 10;
    }
    
    function calculateTravelCost(distance) {
        return Math.ceil(distance * (1 / currentShip.fuelEfficiency));
    }
    
    function travelToPlanet() {
        if (!selectedPlanet || !currentPlanet) return;
        
        const distance = calculateDistance(currentPlanet, selectedPlanet);
        const travelCost = calculateTravelCost(distance);
        
        if (travelCost > fuel) {
            showMessage('Not Enough Fuel', 'You do not have enough fuel to travel to this planet.');
            return;
        }
        
        fuel -= travelCost;
        currentPlanet = selectedPlanet;
        
        updateStats();
        renderPlanets();
        showMarket();
    }
    
    function showMarket() {
        document.getElementById('marketPlanetName').innerText = currentPlanet.name;
        
        const buyResourcesList = document.getElementById('buyResourcesList');
        const sellResourcesList = document.getElementById('sellResourcesList');
        
        buyResourcesList.innerHTML = '';
        sellResourcesList.innerHTML = '';
        
        const resourceNames = Object.keys(resourceTypes);
        
        for (const resourceName of resourceNames) {
            const resource = resourceTypes[resourceName];
            const planetResource = currentPlanet.resources[resourceName];
            
            const buyCard = document.createElement('div');
            buyCard.className = 'resource-card';
            buyCard.innerHTML = `
                <div class="resource-icon" style="background-color: ${resource.color}">
                    <i class="fas ${resource.icon}"></i>
                </div>
                <div class="resource-details">
                    <div class="resource-name">${resource.name}</div>
                    <div class="resource-price">${planetResource.price} credits</div>
                    <div class="resource-available">${planetResource.available} units</div>
                </div>
            `;
            
            buyCard.addEventListener('click', function() {
                if (planetResource.available > 0) {
                    openTransactionModal('buy', resourceName, planetResource.price, planetResource.available);
                }
            });
            
            buyResourcesList.appendChild(buyCard);
            
            const cargoAmount = cargoHold[resourceName] || 0;
            
            if (cargoAmount > 0) {
                const sellCard = document.createElement('div');
                sellCard.className = 'resource-card';
                sellCard.innerHTML = `
                    <div class="resource-icon" style="background-color: ${resource.color}">
                        <i class="fas ${resource.icon}"></i>
                    </div>
                    <div class="resource-details">
                        <div class="resource-name">${resource.name}</div>
                        <div class="resource-price">${planetResource.price} credits</div>
                        <div class="resource-available">${cargoAmount} in cargo</div>
                    </div>
                `;
                
                sellCard.addEventListener('click', function() {
                    openTransactionModal('sell', resourceName, planetResource.price, cargoAmount);
                });
                
                sellResourcesList.appendChild(sellCard);
            }
        }
        
        updateCargoSpace();
        
        const shipsList = document.getElementById('shipsList');
        shipsList.innerHTML = '';
        
        const shipNames = Object.keys(shipTypes);
        
        for (const shipName of shipNames) {
            const ship = shipTypes[shipName];
            
            if (ship.name === currentShip.name) continue;
            
            const shipCard = document.createElement('div');
            shipCard.className = 'ship-card';
            shipCard.innerHTML = `
                <div class="ship-icon">
                    <i class="fas ${ship.icon}"></i>
                </div>
                <div class="ship-details">
                    <div class="ship-name">${ship.name}</div>
                    <div class="ship-price">${ship.price} credits</div>
                    <div class="ship-stats">Cargo: ${ship.cargoCapacity} units</div>
                    <div class="ship-stats">Efficiency: ${ship.fuelEfficiency.toFixed(1)}x</div>
                </div>
            `;
            
            shipCard.addEventListener('click', function() {
                openShipPurchaseModal(ship);
            });
            
            shipsList.appendChild(shipCard);
        }
        
        document.getElementById('marketPanel').classList.remove('hidden');
    }
    
    function updateCargoSpace() {
        let usedSpace = 0;
        
        for (const resourceName in cargoHold) {
            usedSpace += cargoHold[resourceName];
        }
        
        document.getElementById('cargoSpace').innerText = `${usedSpace}/${currentShip.cargoCapacity}`;
    }
    
    function openTransactionModal(type, resourceName, price, available) {
        const resource = resourceTypes[resourceName];
        currentTransaction = {
            type: type,
            resource: resourceName,
            price: price,
            available: available,
            quantity: 1
        };
        
        document.getElementById('transactionTitle').innerText = type === 'buy' ? 'Buy Resource' : 'Sell Resource';
        
        const resourceImage = document.getElementById('transactionResourceImage');
        resourceImage.style.backgroundColor = resource.color;
        resourceImage.innerHTML = `<i class="fas ${resource.icon}"></i>`;
        
        document.getElementById('transactionResourceName').innerText = resource.name;
        document.getElementById('transactionPrice').innerText = `${price} credits per unit`;
        document.getElementById('transactionAvailable').innerText = `${available} units`;
        
        document.getElementById('transactionQty').value = 1;
        document.getElementById('transactionQty').max = available;
        
        if (type === 'buy') {
            const maxAffordable = Math.floor(credits / price);
            const maxCargo = currentShip.cargoCapacity - calculateUsedCargoSpace();
            const effectiveMax = Math.min(available, maxAffordable, maxCargo);
            document.getElementById('transactionQty').max = effectiveMax;
        }
        
        updateTransactionTotal();
        
        document.getElementById('transactionModal').classList.remove('hidden');
    }
    
    function calculateUsedCargoSpace() {
        let used = 0;
        for (const resource in cargoHold) {
            used += cargoHold[resource];
        }
        return used;
    }
    
    function updateTransactionTotal() {
        const quantity = parseInt(document.getElementById('transactionQty').value) || 0;
        const total = quantity * currentTransaction.price;
        
        document.getElementById('transactionTotal').innerText = `${total} credits`;
    }
    
    function confirmTransaction() {
        const quantity = parseInt(document.getElementById('transactionQty').value) || 0;
        
        if (quantity <= 0 || quantity > currentTransaction.available) {
            return;
        }
        
        const totalCost = quantity * currentTransaction.price;
        
        if (currentTransaction.type === 'buy') {
            if (totalCost > credits) {
                showMessage('Not Enough Credits', 'You do not have enough credits to complete this purchase.');
                return;
            }
            
            const usedSpace = calculateUsedCargoSpace();
            if (usedSpace + quantity > currentShip.cargoCapacity) {
                showMessage('Cargo Full', 'You do not have enough cargo space for this purchase.');
                return;
            }
            
            credits -= totalCost;
            
            if (!cargoHold[currentTransaction.resource]) {
                cargoHold[currentTransaction.resource] = 0;
            }
            
            cargoHold[currentTransaction.resource] += quantity;
            currentPlanet.resources[currentTransaction.resource].available -= quantity;
            
        } else if (currentTransaction.type === 'sell') {
            credits += totalCost;
            cargoHold[currentTransaction.resource] -= quantity;
            
            if (cargoHold[currentTransaction.resource] <= 0) {
                delete cargoHold[currentTransaction.resource];
            }
            
            currentPlanet.resources[currentTransaction.resource].available += quantity;
        }
        
        updateStats();
        document.getElementById('transactionModal').classList.add('hidden');
        showMarket();
        
        if (credits >= 1000000) {
            gameOver();
        }
    }
    
    function openShipPurchaseModal(ship) {
        if (ship.price > credits) {
            showMessage('Not Enough Credits', 'You do not have enough credits to purchase this ship.');
            return;
        }
        
        const usedSpace = calculateUsedCargoSpace();
        if (usedSpace > ship.cargoCapacity) {
            showMessage('Too Much Cargo', 'This ship cannot hold all your current cargo. Sell some items first.');
            return;
        }
        
        showMessage('Confirm Purchase', `Do you want to purchase the ${ship.name} for ${ship.price} credits?`, function() {
            purchaseShip(ship);
        });
    }
    
    function purchaseShip(ship) {
        credits -= ship.price;
        currentShip = {
            name: ship.name,
            cargoCapacity: ship.cargoCapacity,
            fuelEfficiency: ship.fuelEfficiency,
            price: ship.price
        };
        
        updateStats();
        showMarket();
    }
    
    function showMessage(title, content, callback) {
        document.getElementById('messageTitle').innerText = title;
        document.getElementById('messageContent').innerText = content;
        
        const closeButton = document.getElementById('closeMessageBtn');
        
        closeButton.onclick = function() {
            document.getElementById('messageModal').classList.add('hidden');
            if (callback) callback();
        };
        
        document.getElementById('messageModal').classList.remove('hidden');
    }
    
    function updateStats() {
        document.getElementById('creditsDisplay').innerText = `Credits: ${formatNumber(credits)}`;
        document.getElementById('shipDisplay').innerText = `Ship: ${currentShip.name}`;
        document.getElementById('fuelDisplay').innerText = `Fuel: ${Math.floor(fuel)}%`;
    }
    
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        credits = 10000;
        fuel = 100;
        cargoHold = {};
        
        currentShip = {
            name: 'Scout',
            cargoCapacity: 100,
            fuelEfficiency: 1.0,
            price: 10000
        };
        
        activePlanets = generatePlanets();
        currentPlanet = activePlanets[0];
        selectedPlanet = currentPlanet;
        
        renderPlanets();
        selectPlanet(currentPlanet);
        updateStats();
        
        document.getElementById('startScreen').classList.add('hidden');
    }
    
    function gameOver() {
        gameRunning = false;
        
        document.getElementById('finalCredits').innerText = formatNumber(credits);
        document.getElementById('finalShip').innerText = currentShip.name;
        
        let rank = 'Novice Trader';
        if (credits >= 2000000) rank = 'Legendary Merchant';
        else if (credits >= 1000000) rank = 'Master Trader';
        else if (credits >= 500000) rank = 'Elite Trader';
        else if (credits >= 250000) rank = 'Established Trader';
        else if (credits >= 100000) rank = 'Skilled Trader';
        else if (credits >= 50000) rank = 'Promising Trader';
        
        document.getElementById('tradeRank').innerText = rank;
        
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
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('pauseScreen').classList.add('hidden');
        startGame();
    });
    document.getElementById('newGameBtn').addEventListener('click', function() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        startGame();
    });
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', toggleHelp);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    document.getElementById('travelBtn').addEventListener('click', travelToPlanet);
    
    document.getElementById('closeMarketBtn').addEventListener('click', function() {
        document.getElementById('marketPanel').classList.add('hidden');
    });
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
            
            this.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
        });
    });
    
    document.getElementById('decreaseQty').addEventListener('click', function() {
        const qtyInput = document.getElementById('transactionQty');
        qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
        updateTransactionTotal();
    });
    
    document.getElementById('increaseQty').addEventListener('click', function() {
        const qtyInput = document.getElementById('transactionQty');
        const maxQty = parseInt(qtyInput.max);
        qtyInput.value = Math.min(maxQty, parseInt(qtyInput.value) + 1);
        updateTransactionTotal();
    });
    
    document.getElementById('transactionQty').addEventListener('input', updateTransactionTotal);
    
    document.getElementById('confirmTransactionBtn').addEventListener('click', confirmTransaction);
    document.getElementById('cancelTransactionBtn').addEventListener('click', function() {
        document.getElementById('transactionModal').classList.add('hidden');
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
    
    window.addEventListener('resize', function() {
        if (activePlanets.length > 0) {
            renderPlanets();
        }
    });
});
