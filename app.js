// ===== APP STATE =====
const ROTATION_DAYS = 21;
let currentWeekOffset = 0;
let selectedDayForRecipe = null;
let currentFilter = 'all';
let appData = { recipes: [], weeklyPlan: {}, checkedItems: [] };

// ===== FIREBASE DATA LAYER =====
const FirebaseDB = {
    async loadRecipes() {
        try {
            const snapshot = await db.collection(COLLECTIONS.RECIPES).where('userId', '==', USER_ID).get();
            const recipes = [];
            snapshot.forEach(doc => recipes.push({ id: doc.id, ...doc.data() }));
            return recipes;
        } catch (error) {
            console.error('Error loading recipes:', error);
            return [];
        }
    },

    async addRecipe(recipe) {
        try {
            const docRef = await db.collection(COLLECTIONS.RECIPES).add({
                ...recipe, userId: USER_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...recipe };
        } catch (error) {
            console.error('Error adding recipe:', error);
            throw error;
        }
    },

    async updateRecipe(id, updates) {
        try {
            await db.collection(COLLECTIONS.RECIPES).doc(id).update({
                ...updates, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating recipe:', error);
            throw error;
        }
    },

    async deleteRecipe(id) {
        try {
            await db.collection(COLLECTIONS.RECIPES).doc(id).delete();
        } catch (error) {
            console.error('Error deleting recipe:', error);
            throw error;
        }
    },

    async loadWeeklyPlan() {
        try {
            const doc = await db.collection(COLLECTIONS.WEEKLY_PLANS).doc(USER_ID).get();
            return doc.exists ? (doc.data().plan || {}) : {};
        } catch (error) {
            console.error('Error loading weekly plan:', error);
            return {};
        }
    },

    async saveWeeklyPlan(plan) {
        try {
            await db.collection(COLLECTIONS.WEEKLY_PLANS).doc(USER_ID).set({
                plan, userId: USER_ID, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error saving weekly plan:', error);
            throw error;
        }
    },

    async loadSettings() {
        try {
            const doc = await db.collection(COLLECTIONS.SETTINGS).doc(USER_ID).get();
            return doc.exists ? doc.data() : { checkedItems: [] };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { checkedItems: [] };
        }
    },

    async saveSettings(settings) {
        try {
            await db.collection(COLLECTIONS.SETTINGS).doc(USER_ID).set({
                ...settings, userId: USER_ID, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    },

    async initializeDefaultRecipes() {
        const recipes = await this.loadRecipes();
        if (recipes.length === 0) {
            console.log('Initializing default recipes...');
            for (const recipe of getDefaultRecipes()) {
                await this.addRecipe(recipe);
            }
            return await this.loadRecipes();
        }
        return recipes;
    }
};

// ===== DEFAULT RECIPES =====
function getDefaultRecipes() {
    return [
        { name: 'Honey Garlic Salmon', prepTime: 10, cookTime: 20, servings: 4,
            ingredients: ['2 lbs salmon fillets', '4 tbsp olive oil', '4 cloves garlic, minced', '3 tbsp honey', '2 tbsp coconut aminos', '1 tsp fresh ginger, grated', 'Salt and pepper', 'Fresh parsley'],
            instructions: ['Preheat oven to 400°F.', 'Whisk oil, garlic, honey, coconut aminos, ginger.', 'Place salmon on lined baking sheet.', 'Pour mixture over salmon.', 'Bake 15-20 minutes.', 'Garnish with parsley.'],
            tags: ['dinner', 'seafood', 'quick', 'healthy'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Thai Basil Chicken Stir Fry', prepTime: 15, cookTime: 15, servings: 4,
            ingredients: ['1.5 lbs chicken thighs, sliced', '3 tbsp avocado oil', '6 cloves garlic, minced', '3 Thai chilies', '2 cups Thai basil', '3 tbsp coconut aminos', '1 tbsp fish sauce', '1 tsp coconut sugar'],
            instructions: ['Heat oil in wok over high heat.', 'Add garlic and chilies, 30 seconds.', 'Add chicken, stir-fry until golden.', 'Add coconut aminos, fish sauce, sugar.', 'Toss in basil until wilted.', 'Serve over rice.'],
            tags: ['dinner', 'chicken', 'asian', 'spicy'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Mediterranean Lamb Meatballs', prepTime: 20, cookTime: 25, servings: 4,
            ingredients: ['1.5 lbs ground lamb', '1/4 cup almond flour', '1 egg', '4 cloves garlic', '2 tsp cumin', '1 tsp coriander', '1/2 tsp cinnamon', 'Mint and parsley', 'Salt and pepper'],
            instructions: ['Preheat oven to 400°F.', 'Mix all ingredients.', 'Form 1.5-inch meatballs.', 'Bake 20-25 minutes.', 'Serve with tahini.'],
            tags: ['dinner', 'lamb', 'mediterranean'], favorite: false, lastCooked: null, sourceUrl: '' },
        { name: 'Crispy Coconut Shrimp', prepTime: 15, cookTime: 10, servings: 4,
            ingredients: ['1 lb large shrimp', '1 cup shredded coconut', '1/2 cup tapioca flour', '2 eggs', 'Avocado oil', '1/2 tsp garlic powder', 'Salt'],
            instructions: ['Set up breading station.', 'Season shrimp.', 'Dredge, dip, coat.', 'Fry until golden.', 'Serve with sweet chili sauce.'],
            tags: ['dinner', 'seafood', 'crispy'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Tuscan Chicken Skillet', prepTime: 10, cookTime: 25, servings: 4,
            ingredients: ['4 chicken breasts', '1 cup coconut cream', '1/2 cup sun-dried tomatoes', '3 cups spinach', '4 cloves garlic', '2 tbsp olive oil', '1 tsp Italian seasoning', 'Salt and pepper'],
            instructions: ['Season chicken.', 'Sear until golden, set aside.', 'Sauté garlic and tomatoes.', 'Add coconut cream, simmer.', 'Return chicken, add spinach.', 'Cover and cook through.'],
            tags: ['dinner', 'chicken', 'italian', 'one-pan'], favorite: false, lastCooked: null, sourceUrl: '' },
        { name: 'Korean BBQ Beef Bowl', prepTime: 15, cookTime: 15, servings: 4,
            ingredients: ['1.5 lbs beef sirloin', '1/4 cup coconut aminos', '2 tbsp sesame oil', '3 tbsp honey', '4 cloves garlic', '1 tbsp ginger', 'Green onions', 'Sesame seeds'],
            instructions: ['Mix marinade ingredients.', 'Marinate beef 30 minutes.', 'Cook until caramelized.', 'Serve over rice with veggies.', 'Top with green onions and sesame.'],
            tags: ['dinner', 'beef', 'asian', 'bowl'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Herb Roasted Chicken Thighs', prepTime: 10, cookTime: 40, servings: 4,
            ingredients: ['8 chicken thighs', '3 tbsp olive oil', '4 cloves garlic', '2 tbsp rosemary', '2 tbsp thyme', '1 lemon', 'Salt and pepper'],
            instructions: ['Preheat oven to 425°F.', 'Mix oil, garlic, herbs, lemon.', 'Rub under and over skin.', 'Arrange and season.', 'Roast 35-40 minutes.'],
            tags: ['dinner', 'chicken', 'roasted', 'herbs'], favorite: false, lastCooked: null, sourceUrl: '' },
        { name: 'Zucchini Noodle Pad Thai', prepTime: 20, cookTime: 10, servings: 4,
            ingredients: ['4 zucchini, spiralized', '1 lb shrimp', '3 eggs', '1 cup bean sprouts', '1/4 cup tamarind paste', '3 tbsp coconut aminos', '2 tbsp fish sauce', 'Peanuts, lime, cilantro'],
            instructions: ['Make sauce.', 'Cook protein, set aside.', 'Scramble eggs.', 'Add zoodles and sauce.', 'Add protein and sprouts.', 'Serve with lime.'],
            tags: ['dinner', 'asian', 'low-carb', 'seafood'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Moroccan Chickpea Stew', prepTime: 15, cookTime: 30, servings: 6,
            ingredients: ['2 cans chickpeas', '1 can diced tomatoes', '2 cups vegetable broth', '1 large sweet potato', '2 tsp cumin', '1 tsp turmeric', '1 tsp cinnamon', 'Cilantro'],
            instructions: ['Sauté onion and garlic.', 'Add spices, toast 1 minute.', 'Add sweet potato, chickpeas, tomatoes, broth.', 'Simmer 25-30 minutes.', 'Serve with cilantro.'],
            tags: ['dinner', 'vegetarian', 'stew', 'moroccan'], favorite: false, lastCooked: null, sourceUrl: '' },
        { name: 'Garlic Butter Steak Bites', prepTime: 10, cookTime: 10, servings: 4,
            ingredients: ['2 lbs sirloin, cubed', '4 tbsp ghee', '6 cloves garlic', '2 tbsp rosemary', '1 tbsp thyme', 'Salt and pepper', 'Parsley'],
            instructions: ['Season steak.', 'Heat cast iron over high.', 'Sear in batches.', 'Add ghee, garlic, herbs.', 'Toss and cook 1 minute.', 'Garnish with parsley.'],
            tags: ['dinner', 'beef', 'quick', 'keto'], favorite: true, lastCooked: null, sourceUrl: '' },
        { name: 'Lemon Herb Baked Cod', prepTime: 10, cookTime: 15, servings: 4,
            ingredients: ['4 cod fillets', '3 tbsp olive oil', '2 lemons', '4 cloves garlic', '2 tbsp fresh dill', '1 tbsp capers', 'Salt and pepper'],
            instructions: ['Preheat oven to 400°F.', 'Place cod on sheet.', 'Drizzle with oil, lemon, garlic.', 'Top with dill and capers.', 'Bake 12-15 minutes.', 'Serve with lemon wedges.'],
            tags: ['dinner', 'seafood', 'healthy', 'quick'], favorite: false, lastCooked: null, sourceUrl: '' },
        { name: 'Cashew Chicken Lettuce Wraps', prepTime: 15, cookTime: 15, servings: 4,
            ingredients: ['1.5 lbs ground chicken', '1 cup cashews', '1 head butter lettuce', '3 tbsp coconut aminos', '2 tbsp rice vinegar', '1 tbsp sesame oil', 'Water chestnuts', 'Green onions'],
            instructions: ['Brown chicken in sesame oil.', 'Add water chestnuts.', 'Add coconut aminos and vinegar.', 'Stir in cashews.', 'Serve in lettuce cups.', 'Top with green onions.'],
            tags: ['dinner', 'chicken', 'low-carb', 'asian'], favorite: true, lastCooked: null, sourceUrl: '' }
    ];
}

// ===== UTILITY FUNCTIONS =====
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function formatDate(date) { return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function getDaysSinceCooked(recipe) {
    if (!recipe.lastCooked) return Infinity;
    return Math.ceil(Math.abs(new Date() - new Date(recipe.lastCooked)) / (1000 * 60 * 60 * 24));
}
function isRecipeAvailable(recipe) { return getDaysSinceCooked(recipe) >= ROTATION_DAYS; }

function showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showSyncIndicator(msg) {
    let ind = document.querySelector('.sync-indicator');
    if (!ind) { ind = document.createElement('div'); ind.className = 'sync-indicator'; document.body.appendChild(ind); }
    ind.textContent = msg;
    ind.classList.add('visible');
    setTimeout(() => ind.classList.remove('visible'), 2000);
}

// ===== NAVIGATION =====
function initNavigation() {
    document.querySelectorAll('.nav-tab, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
}

function switchView(viewName) {
    document.querySelectorAll('.nav-tab, .mobile-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    if (viewName === 'daily') renderDailyView();
    else if (viewName === 'weekly') renderWeeklyView();
    else if (viewName === 'shopping') renderShoppingView();
    else if (viewName === 'recipes') renderRecipesView();
}

// ===== MODAL FUNCTIONS =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openAddRecipeModal() { document.getElementById('add-recipe-form').reset(); openModal('add-recipe-modal'); }
function openImportModal() { document.getElementById('import-url').value = ''; openModal('import-modal'); }

// ===== DAILY VIEW =====
function renderDailyView() {
    document.getElementById('current-date').textContent = formatDate(new Date());
    const availableRecipes = appData.recipes.filter(isRecipeAvailable);
    const suggestion = availableRecipes.length > 0 ? availableRecipes[Math.floor(Math.random() * availableRecipes.length)] : appData.recipes[0];
    const el = document.getElementById('daily-suggestion');
    
    if (suggestion) {
        const totalTime = (suggestion.prepTime || 0) + (suggestion.cookTime || 0);
        el.innerHTML = `
            <div class="suggestion-label"><span>✨</span> Today's Suggestion</div>
            <h2 class="suggestion-recipe-name">${suggestion.name}</h2>
            <div class="suggestion-meta">
                <span class="meta-item">⏱️ ${totalTime} min</span>
                <span class="meta-item">👥 ${suggestion.servings || 4} servings</span>
                ${suggestion.lastCooked ? `<span class="meta-item">📅 Last made ${getDaysSinceCooked(suggestion)} days ago</span>` : ''}
            </div>
            <div class="suggestion-tags">
                ${suggestion.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                <span class="tag dietary">Dairy-free</span>
                <span class="tag dietary">Wheat-free</span>
            </div>
            <div class="suggestion-actions">
                <button class="btn btn-primary btn-large" onclick="cookRecipe('${suggestion.id}')">🍳 Cook This</button>
                <button class="btn btn-secondary btn-large" onclick="viewRecipeDetail('${suggestion.id}')">View Recipe</button>
                <button class="btn btn-secondary btn-large" onclick="getNewSuggestion()">🔄 Different Idea</button>
            </div>`;
    } else {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes yet</h3><p class="empty-state-text">Add some recipes to get started!</p><button class="btn btn-primary" onclick="openAddRecipeModal()">Add Recipe</button></div>`;
    }
    
    const favGrid = document.getElementById('favorites-grid');
    const favorites = appData.recipes.filter(r => r.favorite);
    favGrid.innerHTML = favorites.length === 0 
        ? `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">💝</div><h3 class="empty-state-title">No favorites yet</h3><p class="empty-state-text">Mark recipes as favorites</p></div>`
        : favorites.map(r => renderRecipeCard(r)).join('');
}

function getNewSuggestion() { renderDailyView(); showToast('Here\'s another idea!', 'success'); }

async function cookRecipe(id) {
    const recipe = appData.recipes.find(r => r.id === id);
    if (recipe) {
        recipe.lastCooked = new Date().toISOString();
        try { await FirebaseDB.updateRecipe(id, { lastCooked: recipe.lastCooked }); showToast(`Marked "${recipe.name}" as cooked!`, 'success'); showSyncIndicator('Synced ✓'); }
        catch (e) { showToast('Failed to save.', 'error'); }
        renderDailyView();
    }
}

// ===== WEEKLY VIEW =====
function renderWeeklyView() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    document.getElementById('week-title').textContent = currentWeekOffset === 0 ? 'This Week' : 
        `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    document.getElementById('week-grid').innerHTML = days.map((day, i) => {
        const date = new Date(startOfWeek); date.setDate(startOfWeek.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        const meals = appData.weeklyPlan[dateKey] || [];
        
        return `<div class="day-card ${isToday ? 'today' : ''}">
            <div class="day-header"><div class="day-name">${day}</div><div class="day-date">${date.getDate()}</div></div>
            <div class="day-content">
                ${meals.map(rid => { const r = appData.recipes.find(x => x.id === rid); return r ? `<div class="day-meal" onclick="viewRecipeDetail('${r.id}')"><span class="day-meal-name">${r.name}</span><button class="day-meal-remove" onclick="event.stopPropagation();removeMealFromDay('${dateKey}','${r.id}')">✕</button></div>` : ''; }).join('')}
                <button class="day-add-btn" onclick="openRecipeSelector('${dateKey}')">+ Add meal</button>
            </div></div>`;
    }).join('');
}

function changeWeek(offset) { currentWeekOffset += offset; renderWeeklyView(); }

async function generateWeeklyPlan() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));
    const available = appData.recipes.filter(isRecipeAvailable);
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek); date.setDate(startOfWeek.getDate() + i);
        const dk = date.toISOString().split('T')[0];
        if (!appData.weeklyPlan[dk] || appData.weeklyPlan[dk].length === 0) {
            const r = shuffled[i % shuffled.length];
            if (r) appData.weeklyPlan[dk] = [r.id];
        }
    }
    try { await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan); showToast('Week plan generated!', 'success'); showSyncIndicator('Synced ✓'); }
    catch (e) { showToast('Failed to save.', 'error'); }
    renderWeeklyView();
}

function openRecipeSelector(dateKey) { selectedDayForRecipe = dateKey; renderRecipeSelector(); openModal('select-recipe-modal'); }

function renderRecipeSelector() {
    const search = document.getElementById('recipe-selector-search')?.value?.toLowerCase() || '';
    document.getElementById('recipe-selector').innerHTML = appData.recipes.filter(r => r.name.toLowerCase().includes(search)).map(r => {
        const avail = isRecipeAvailable(r), days = getDaysSinceCooked(r);
        return `<div class="recipe-selector-item ${!avail ? 'unavailable' : ''}" onclick="${avail ? `selectRecipeForDay('${r.id}')` : ''}">
            <div class="recipe-selector-name">${r.name}</div>
            <div class="recipe-selector-meta">${avail ? '✅ Available' : `⏳ ${ROTATION_DAYS - days}d left`} • ${(r.prepTime||0)+(r.cookTime||0)} min</div></div>`;
    }).join('');
}

function filterRecipeSelector() { renderRecipeSelector(); }

async function selectRecipeForDay(recipeId) {
    if (!appData.weeklyPlan[selectedDayForRecipe]) appData.weeklyPlan[selectedDayForRecipe] = [];
    appData.weeklyPlan[selectedDayForRecipe].push(recipeId);
    try { await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan); showToast('Recipe added!', 'success'); showSyncIndicator('Synced ✓'); }
    catch (e) { showToast('Failed to save.', 'error'); }
    closeModal('select-recipe-modal'); renderWeeklyView();
}

async function removeMealFromDay(dateKey, recipeId) {
    if (appData.weeklyPlan[dateKey]) {
        appData.weeklyPlan[dateKey] = appData.weeklyPlan[dateKey].filter(id => id !== recipeId);
        try { await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan); showSyncIndicator('Synced ✓'); }
        catch (e) { showToast('Failed to save.', 'error'); }
        renderWeeklyView();
    }
}

// ===== SHOPPING VIEW =====
function renderShoppingView() {
    const categories = generateShoppingList();
    const container = document.getElementById('shopping-categories');
    const config = { produce: { icon: '🥬', name: 'Produce' }, protein: { icon: '🥩', name: 'Protein' }, dairy: { icon: '🧀', name: 'Dairy Alternatives' }, pantry: { icon: '🫙', name: 'Pantry' }, spices: { icon: '🌿', name: 'Spices & Herbs' }, other: { icon: '📦', name: 'Other' } };
    
    if (Object.keys(categories).length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🛒</div><h3 class="empty-state-title">Shopping list is empty</h3><p class="empty-state-text">Add meals to your weekly plan</p><button class="btn btn-primary" onclick="switchView('weekly')">Plan Your Week</button></div>`;
        return;
    }
    
    container.innerHTML = Object.entries(categories).map(([cat, items]) => {
        const c = config[cat] || config.other;
        return `<div class="category-card"><div class="category-header ${cat}"><span class="category-icon">${c.icon}</span><span class="category-name">${c.name}</span><span class="category-count">${items.length} items</span></div>
            <div class="category-items">${items.map(item => {
                const checked = appData.checkedItems.includes(item.id);
                return `<div class="shopping-item ${checked ? 'checked' : ''}"><div class="shopping-checkbox ${checked ? 'checked' : ''}" onclick="toggleShoppingItem('${item.id}')">${checked ? '✓' : ''}</div><span class="shopping-item-text">${item.name}</span></div>`;
            }).join('')}</div></div>`;
    }).join('');
}

function generateShoppingList() {
    const ingredients = {}, categories = {};
    Object.values(appData.weeklyPlan).forEach(meals => {
        meals.forEach(rid => {
            const r = appData.recipes.find(x => x.id === rid);
            if (r?.ingredients) r.ingredients.forEach(ing => {
                const k = ing.toLowerCase().trim();
                if (!ingredients[k]) ingredients[k] = { id: generateId(), name: ing, category: categorizeIngredient(ing) };
            });
        });
    });
    Object.values(ingredients).forEach(i => { if (!categories[i.category]) categories[i.category] = []; categories[i.category].push(i); });
    return categories;
}

function categorizeIngredient(ing) {
    const i = ing.toLowerCase();
    if (/chicken|beef|lamb|pork|fish|salmon|shrimp|cod|turkey/.test(i)) return 'protein';
    if (/goat|coconut cream|coconut milk|ghee/.test(i)) return 'dairy';
    if (/spinach|lettuce|zucchini|tomato|onion|garlic|pepper|potato|carrot|celery|cucumber|mushroom|broccoli|asparagus|basil|parsley|cilantro|mint|dill|lime|lemon|ginger|sweet potato|bean sprout/.test(i)) return 'produce';
    if (/cumin|coriander|turmeric|paprika|cinnamon|oregano|thyme|rosemary|salt|pepper|seasoning/.test(i)) return 'spices';
    if (/flour|oil|honey|vinegar|sauce|sugar|broth|stock|aminos|tapioca/.test(i)) return 'pantry';
    return 'other';
}

async function toggleShoppingItem(itemId) {
    const idx = appData.checkedItems.indexOf(itemId);
    if (idx > -1) appData.checkedItems.splice(idx, 1); else appData.checkedItems.push(itemId);
    try { await FirebaseDB.saveSettings({ checkedItems: appData.checkedItems }); } catch (e) { console.error(e); }
    renderShoppingView();
}

async function clearCheckedItems() {
    appData.checkedItems = [];
    try { await FirebaseDB.saveSettings({ checkedItems: [] }); showSyncIndicator('Synced ✓'); } catch (e) { showToast('Failed.', 'error'); }
    renderShoppingView(); showToast('Cleared checked items', 'success');
}

async function regenerateShoppingList() {
    appData.checkedItems = [];
    try { await FirebaseDB.saveSettings({ checkedItems: [] }); showSyncIndicator('Synced ✓'); } catch (e) { showToast('Failed.', 'error'); }
    renderShoppingView(); showToast('Regenerated!', 'success');
}

// ===== RECIPES VIEW =====
function renderRecipesView() { updateStats(); renderAllRecipes(); initFilterChips(); }

function updateStats() {
    document.getElementById('stat-total').textContent = appData.recipes.length;
    document.getElementById('stat-available').textContent = appData.recipes.filter(isRecipeAvailable).length;
    document.getElementById('stat-favorites').textContent = appData.recipes.filter(r => r.favorite).length;
}

function renderAllRecipes() {
    const grid = document.getElementById('all-recipes-grid');
    const search = document.getElementById('recipe-search')?.value?.toLowerCase() || '';
    let filtered = appData.recipes.filter(r => r.name.toLowerCase().includes(search) || r.tags.some(t => t.toLowerCase().includes(search)));
    if (currentFilter === 'available') filtered = filtered.filter(isRecipeAvailable);
    else if (currentFilter === 'favorites') filtered = filtered.filter(r => r.favorite);
    else if (currentFilter === 'quick') filtered = filtered.filter(r => (r.prepTime||0)+(r.cookTime||0) <= 30);
    
    grid.innerHTML = filtered.length === 0 
        ? `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes found</h3><p class="empty-state-text">Try a different search</p></div>`
        : filtered.map(r => renderRecipeCard(r)).join('');
}

function renderRecipeCard(recipe) {
    const avail = isRecipeAvailable(recipe), days = getDaysSinceCooked(recipe), time = (recipe.prepTime||0)+(recipe.cookTime||0);
    return `<div class="recipe-card" onclick="viewRecipeDetail('${recipe.id}')">
        ${!avail ? `<div class="rotation-badge">${ROTATION_DAYS-days}d left</div>` : recipe.lastCooked ? `<div class="rotation-badge available">Available</div>` : ''}
        <div class="recipe-card-header"><h3 class="recipe-card-name">${recipe.name}</h3>
            <button class="favorite-btn ${recipe.favorite?'favorited':''}" onclick="event.stopPropagation();toggleFavorite('${recipe.id}')">${recipe.favorite?'❤️':'🤍'}</button></div>
        <div class="recipe-card-meta"><span>⏱️ ${time} min</span><span>👥 ${recipe.servings||4}</span></div>
        <div class="recipe-card-tags">${recipe.tags.slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div>`;
}

function initFilterChips() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active'); currentFilter = chip.dataset.filter; renderAllRecipes();
        });
    });
}

function filterRecipes() { renderAllRecipes(); }

async function toggleFavorite(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (r) {
        r.favorite = !r.favorite;
        try { await FirebaseDB.updateRecipe(id, { favorite: r.favorite }); showToast(r.favorite ? `Added to favorites` : `Removed`, 'success'); showSyncIndicator('Synced ✓'); }
        catch (e) { showToast('Failed.', 'error'); }
        renderAllRecipes(); renderDailyView();
    }
}

// ===== RECIPE DETAIL =====
function viewRecipeDetail(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (!r) return;
    const time = (r.prepTime||0)+(r.cookTime||0);
    document.getElementById('recipe-detail-content').innerHTML = `
        <div class="recipe-detail-header"><h2 class="recipe-detail-name">${r.name}</h2>
            <div class="recipe-detail-meta"><span>⏱️ ${time} min</span><span>👥 ${r.servings||4}</span>${r.lastCooked?`<span>📅 ${getDaysSinceCooked(r)} days ago</span>`:''}</div></div>
        <div class="recipe-detail-section"><h3 class="recipe-detail-section-title">Ingredients</h3><ul class="ingredient-list">${r.ingredients.map(i=>`<li class="ingredient-item">${i}</li>`).join('')}</ul></div>
        <div class="recipe-detail-section"><h3 class="recipe-detail-section-title">Instructions</h3><ol class="instruction-list">${r.instructions.map(s=>`<li class="instruction-item">${s}</li>`).join('')}</ol></div>
        <div class="modal-footer"><button class="btn btn-danger" onclick="deleteRecipe('${r.id}')">🗑️ Delete</button><button class="btn btn-primary" onclick="cookRecipe('${r.id}');closeModal('recipe-detail-modal');">🍳 Mark Cooked</button></div>`;
    openModal('recipe-detail-modal');
}

async function deleteRecipe(id) {
    if (confirm('Delete this recipe?')) {
        try {
            await FirebaseDB.deleteRecipe(id);
            appData.recipes = appData.recipes.filter(r => r.id !== id);
            Object.keys(appData.weeklyPlan).forEach(k => { appData.weeklyPlan[k] = appData.weeklyPlan[k].filter(rid => rid !== id); });
            await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
            closeModal('recipe-detail-modal'); showToast('Deleted', 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
        } catch (e) { showToast('Failed to delete.', 'error'); }
    }
}

// ===== ADD RECIPE =====
async function handleAddRecipe(event) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const recipe = {
        name: fd.get('name'), prepTime: parseInt(fd.get('prepTime'))||0, cookTime: parseInt(fd.get('cookTime'))||0, servings: parseInt(fd.get('servings'))||4,
        ingredients: fd.get('ingredients').split('\n').filter(i=>i.trim()).map(applySubstitutions),
        instructions: fd.get('instructions').split('\n').filter(i=>i.trim()),
        tags: fd.get('tags').split(',').map(t=>t.trim()).filter(t=>t),
        sourceUrl: fd.get('sourceUrl')||'', favorite: false, lastCooked: null
    };
    try {
        const newRecipe = await FirebaseDB.addRecipe(recipe);
        appData.recipes.push(newRecipe);
        closeModal('add-recipe-modal'); showToast(`Added "${recipe.name}"!`, 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
    } catch (e) { showToast('Failed to add.', 'error'); }
}

function applySubstitutions(ing) {
    return ing.replace(/\b(milk)\b/gi,'goat milk').replace(/\b(cream)\b(?!.*coconut)/gi,'coconut cream').replace(/\b(butter)\b(?!.*ghee)/gi,'ghee').replace(/\b(cheese)\b/gi,'goat cheese').replace(/\b(yogurt)\b/gi,'coconut yogurt').replace(/\b(vegetable oil|canola oil|sunflower oil|safflower oil|soybean oil)\b/gi,'avocado oil').replace(/\b(all-purpose flour|wheat flour|bread flour)\b/gi,'gluten-free flour blend').replace(/\b(soy sauce)\b/gi,'coconut aminos');
}

async function importRecipe() {
    const url = document.getElementById('import-url').value.trim();
    if (!url) { showToast('Please enter a URL', 'error'); return; }
    showToast('Import is a demo. Add recipes manually.', 'default');
}

// ===== INITIALIZATION =====
async function initializeApp() {
    try {
        const [recipes, weeklyPlan, settings] = await Promise.all([FirebaseDB.initializeDefaultRecipes(), FirebaseDB.loadWeeklyPlan(), FirebaseDB.loadSettings()]);
        appData.recipes = recipes; appData.weeklyPlan = weeklyPlan; appData.checkedItems = settings.checkedItems || [];
        initNavigation(); renderDailyView();
        document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) {
        console.error('Init error:', e);
        showToast('Failed to load. Please refresh.', 'error');
        document.getElementById('loading-screen').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initializeApp, 500));
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); });
