// ===== APP STATE =====
const ROTATION_DAYS = 21;
let currentWeekOffset = 0;
let selectedDayForRecipe = null;
let selectedMealSlot = null; // 'lunch' or 'dinner'
let currentFilter = 'all';
let suggestionType = 'favorite'; // 'favorite' or 'discover'
let appData = { recipes: [], weeklyPlan: {}, checkedItems: [] };

// ===== FIREBASE DATA LAYER =====
const FirebaseDB = {
    async loadRecipes() {
        const snapshot = await db.collection(COLLECTIONS.RECIPES).where('userId', '==', USER_ID).get();
        const recipes = [];
        snapshot.forEach(doc => recipes.push({ id: doc.id, ...doc.data() }));
        return recipes;
    },
    async addRecipe(recipe) {
        const docRef = await db.collection(COLLECTIONS.RECIPES).add({ ...recipe, userId: USER_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        return { id: docRef.id, ...recipe };
    },
    async updateRecipe(id, updates) {
        await db.collection(COLLECTIONS.RECIPES).doc(id).update({ ...updates, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    },
    async deleteRecipe(id) {
        await db.collection(COLLECTIONS.RECIPES).doc(id).delete();
    },
    async loadWeeklyPlan() {
        const doc = await db.collection(COLLECTIONS.WEEKLY_PLANS).doc(USER_ID).get();
        return doc.exists ? (doc.data().plan || {}) : {};
    },
    async saveWeeklyPlan(plan) {
        await db.collection(COLLECTIONS.WEEKLY_PLANS).doc(USER_ID).set({ plan, userId: USER_ID, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    },
    async loadSettings() {
        const doc = await db.collection(COLLECTIONS.SETTINGS).doc(USER_ID).get();
        return doc.exists ? doc.data() : { checkedItems: [] };
    },
    async saveSettings(settings) {
        await db.collection(COLLECTIONS.SETTINGS).doc(USER_ID).set({ ...settings, userId: USER_ID, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    },
    async initializeDefaultRecipes() {
        const recipes = await this.loadRecipes();
        if (recipes.length === 0) {
            for (const recipe of getDefaultRecipes()) await this.addRecipe(recipe);
            return await this.loadRecipes();
        }
        return recipes;
    }
};

// ===== DEFAULT RECIPES (Your original favorites with source URLs) =====
function getDefaultRecipes() {
    return [
        { name: '20 Minute Grilled Jerk Chicken with Mango-Nectarine Salsa', prepTime: 10, cookTime: 10, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'chicken', 'grilled', 'quick'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/20-minute-grilled-jerk-chicken-with-mango-nectarine-salsa/', imageUrl: '' },
        { name: 'Heirloom Tomato Pomodoro Penne Pasta', prepTime: 15, cookTime: 40, servings: 6, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'pasta', 'italian', 'vegetarian'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/heirloom-tomato-pomodoro-penne-pasta/', imageUrl: '' },
        { name: 'Steak Fajitas with Chimichurri and Cucumber Salsa', prepTime: 10, cookTime: 15, servings: 6, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'beef', 'mexican', 'fajitas'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/steak-fajitas-chimichurri-cucumber-salsa/', imageUrl: '' },
        { name: '20 Minute Basil Cashew Chicken', prepTime: 10, cookTime: 10, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'chicken', 'asian', 'quick', 'thai'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/20-minute-basil-cashew-chicken/', imageUrl: '' },
        { name: 'Korean Chicken Bowl', prepTime: 15, cookTime: 15, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'chicken', 'korean', 'bowl', 'asian'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/korean-chicken-bowl/', imageUrl: '' },
        { name: 'Chicken Pho', prepTime: 15, cookTime: 45, servings: 6, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'soup', 'vietnamese', 'chicken', 'asian'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/chicken-pho/', imageUrl: '' },
        { name: 'Skillet Moroccan Chicken', prepTime: 15, cookTime: 35, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'chicken', 'moroccan', 'one-pan'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/skillet-moroccan-chicken/', imageUrl: '' },
        { name: 'Egg Drop Chicken Rice Soup', prepTime: 10, cookTime: 20, servings: 4, mealType: 'lunch', ingredients: [], instructions: [], tags: ['lunch', 'soup', 'chicken', 'asian', 'comfort'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/egg-drop-chicken-rice-soup/', imageUrl: '' },
        { name: 'Instant Pot Pesto Zuppa Toscana', prepTime: 15, cookTime: 20, servings: 6, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'soup', 'instant-pot', 'italian'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/instant-pot-pesto-zuppa-toscana/', imageUrl: '' },
        { name: 'Chicken Gyros Souvlaki with Tzatziki', prepTime: 20, cookTime: 15, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'chicken', 'greek', 'mediterranean'], favorite: true, lastCooked: null, sourceUrl: 'https://www.cookingclassy.com/gyros-chicken-souvlaki-tzatkiki-homemade-greek-flatbread/', imageUrl: '' },
        { name: 'Crockpot Spicy Chicken Tortilla Soup', prepTime: 15, cookTime: 240, servings: 6, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'soup', 'mexican', 'crockpot', 'chicken'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/crockpot-spicy-chicken-tortilla-soup/', imageUrl: '' },
        { name: 'Thai Drunken Noodles', prepTime: 15, cookTime: 15, servings: 4, mealType: 'dinner', ingredients: [], instructions: [], tags: ['dinner', 'noodles', 'thai', 'asian', 'spicy'], favorite: true, lastCooked: null, sourceUrl: 'https://www.halfbakedharvest.com/better-than-takeout-thai-drunken-noodles/', imageUrl: '' }
    ];
}

// ===== UTILITIES =====
function formatDate(date) { return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function getDaysSinceCooked(r) { return r.lastCooked ? Math.ceil(Math.abs(new Date() - new Date(r.lastCooked)) / 86400000) : Infinity; }
function isRecipeAvailable(r) { return getDaysSinceCooked(r) >= ROTATION_DAYS; }
function getRecipeEmoji(r) {
    const t = r.tags || [], n = r.name.toLowerCase();
    if (t.includes('seafood') || /salmon|shrimp|cod|fish/.test(n)) return '🐟';
    if (t.includes('chicken') || n.includes('chicken')) return '🍗';
    if (t.includes('beef') || /beef|steak/.test(n)) return '🥩';
    if (t.includes('lamb')) return '🍖';
    if (t.includes('vegetarian') || t.includes('pasta')) return '🍝';
    if (t.includes('soup')) return '🍲';
    if (t.includes('lunch')) return '🥗';
    return '🍽️';
}
function getMealTypeEmoji(mealType) {
    return mealType === 'lunch' ? '🥗' : '🍽️';
}
function showToast(msg, type='default') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}
function showSyncIndicator(msg) {
    let i = document.querySelector('.sync-indicator');
    if (!i) { i = document.createElement('div'); i.className = 'sync-indicator'; document.body.appendChild(i); }
    i.textContent = msg; i.classList.add('visible');
    setTimeout(() => i.classList.remove('visible'), 2000);
}

// ===== NAVIGATION & MODALS =====
function initNavigation() {
    document.querySelectorAll('.nav-tab, .mobile-nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
}
function switchView(v) {
    document.querySelectorAll('.nav-tab, .mobile-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${v}-view`).classList.add('active');
    if (v === 'daily') renderDailyView();
    else if (v === 'weekly') renderWeeklyView();
    else if (v === 'shopping') renderShoppingView();
    else if (v === 'recipes') renderRecipesView();
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openAddRecipeModal() { 
    document.getElementById('add-recipe-form').reset(); 
    document.getElementById('import-url').value = '';
    document.getElementById('add-mealType').value = 'dinner';
    document.querySelectorAll('#add-recipe-modal .meal-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.meal === 'dinner');
    });
    openModal('add-recipe-modal'); 
}

// ===== MEAL TYPE TOGGLE =====
function toggleMealType(btn, formPrefix) {
    const container = btn.parentElement;
    container.querySelectorAll('.meal-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${formPrefix}-mealType`).value = btn.dataset.meal;
}

// ===== SUGGESTION TYPE TOGGLE =====
function setSuggestionType(type) {
    suggestionType = type;
    document.querySelectorAll('.suggestion-toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
    });
    renderDailyView();
}

// ===== DAILY VIEW =====
function renderDailyView() {
    document.getElementById('current-date').textContent = formatDate(new Date());
    
    let pool;
    let suggestionLabel;
    
    if (suggestionType === 'favorite') {
        // From favorites that are available
        pool = appData.recipes.filter(r => r.favorite && isRecipeAvailable(r));
        if (pool.length === 0) pool = appData.recipes.filter(r => r.favorite); // Fall back to all favorites
        suggestionLabel = '❤️ From Your Favorites';
    } else {
        // Discover: non-favorites that are available
        pool = appData.recipes.filter(r => !r.favorite && isRecipeAvailable(r));
        if (pool.length === 0) pool = appData.recipes.filter(r => !r.favorite);
        suggestionLabel = '✨ Discover Something New';
    }
    
    const s = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : appData.recipes[0];
    const el = document.getElementById('daily-suggestion');
    
    if (!s) { 
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes yet</h3><button class="btn btn-primary" onclick="openAddRecipeModal()">Add Recipe</button></div>'; 
        return; 
    }
    
    const time = (s.prepTime||0) + (s.cookTime||0);
    const img = s.imageUrl ? `<img src="${s.imageUrl}" class="suggestion-image" onerror="this.style.display='none'">` : '';
    const mealBadge = `<span class="meal-type-badge ${s.mealType || 'dinner'}">${getMealTypeEmoji(s.mealType)} ${(s.mealType || 'dinner').charAt(0).toUpperCase() + (s.mealType || 'dinner').slice(1)}</span>`;
    
    el.innerHTML = `<div class="suggestion-content">${img}<div class="suggestion-details">
        <div class="suggestion-label"><span>${suggestionLabel}</span></div>
        <h2 class="suggestion-recipe-name">${s.name}</h2>
        <div class="suggestion-meta">
            ${mealBadge}
            <span class="meta-item">⏱️ ${time} min</span>
            <span class="meta-item">👥 ${s.servings||4}</span>
            ${s.lastCooked?`<span class="meta-item">📅 ${getDaysSinceCooked(s)} days ago</span>`:''}
        </div>
        <div class="suggestion-tags">${(s.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}<span class="tag dietary">Dairy-free</span><span class="tag dietary">Wheat-free</span></div>
        ${s.sourceUrl?`<a href="${s.sourceUrl}" target="_blank" class="source-link" onclick="event.stopPropagation()">🔗 View Original Recipe</a>`:''}
        <div class="suggestion-actions" style="margin-top:var(--space-md)">
            <button class="btn btn-primary btn-large" onclick="cookRecipe('${s.id}')">🍳 Cook This</button>
            <button class="btn btn-secondary btn-large" onclick="viewRecipeDetail('${s.id}')">View Recipe</button>
            <button class="btn btn-secondary btn-large" onclick="renderDailyView();showToast('New suggestion!','success')">🔄 Different</button>
        </div>
    </div></div>`;
    
    const fg = document.getElementById('favorites-grid');
    const fav = appData.recipes.filter(r => r.favorite);
    fg.innerHTML = fav.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">💝</div><h3 class="empty-state-title">No favorites</h3></div>' : fav.map(renderRecipeCard).join('');
}

async function cookRecipe(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (r) { 
        r.lastCooked = new Date().toISOString(); 
        await FirebaseDB.updateRecipe(id, { lastCooked: r.lastCooked }); 
        showToast(`Marked "${r.name}" as cooked!`, 'success'); 
        showSyncIndicator('Synced ✓'); 
        renderDailyView(); 
    }
}

// ===== WEEKLY VIEW (with Lunch/Dinner) =====
function renderWeeklyView() {
    const today = new Date(), start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    document.getElementById('week-title').textContent = currentWeekOffset === 0 ? 'This Week' : `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${end.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    document.getElementById('week-grid').innerHTML = days.map((d,i) => {
        const date = new Date(start); date.setDate(start.getDate() + i);
        const dk = date.toISOString().split('T')[0], isToday = date.toDateString() === today.toDateString();
        const dayPlan = appData.weeklyPlan[dk] || { lunch: [], dinner: [] };
        
        // Handle old format (array) vs new format (object with lunch/dinner)
        let lunch = [], dinner = [];
        if (Array.isArray(dayPlan)) {
            // Old format - treat all as dinner
            dinner = dayPlan;
        } else {
            lunch = dayPlan.lunch || [];
            dinner = dayPlan.dinner || [];
        }
        
        return `<div class="day-card ${isToday?'today':''}">
            <div class="day-header">
                <div class="day-name">${d}</div>
                <div class="day-date">${date.getDate()}</div>
            </div>
            <div class="day-content">
                <div class="meal-slot">
                    <div class="meal-slot-header">🥗 Lunch</div>
                    ${lunch.map(rid => {
                        const r = appData.recipes.find(x => x.id === rid);
                        return r ? `<div class="day-meal" onclick="viewRecipeDetail('${r.id}')">
                            <span class="day-meal-name">${r.name}</span>
                            <button class="day-meal-remove" onclick="event.stopPropagation();removeMealFromDay('${dk}','${r.id}','lunch')">✕</button>
                        </div>` : '';
                    }).join('')}
                    <button class="day-add-btn" onclick="openRecipeSelector('${dk}', 'lunch')">+ Add Lunch</button>
                </div>
                <div class="meal-slot">
                    <div class="meal-slot-header">🍽️ Dinner</div>
                    ${dinner.map(rid => {
                        const r = appData.recipes.find(x => x.id === rid);
                        return r ? `<div class="day-meal" onclick="viewRecipeDetail('${r.id}')">
                            <span class="day-meal-name">${r.name}</span>
                            <button class="day-meal-remove" onclick="event.stopPropagation();removeMealFromDay('${dk}','${r.id}','dinner')">✕</button>
                        </div>` : '';
                    }).join('')}
                    <button class="day-add-btn" onclick="openRecipeSelector('${dk}', 'dinner')">+ Add Dinner</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function changeWeek(o) { currentWeekOffset += o; renderWeeklyView(); }

async function generateWeeklyPlan() {
    const today = new Date(), start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7);
    
    const lunchRecipes = appData.recipes.filter(r => isRecipeAvailable(r) && (r.mealType === 'lunch' || r.tags?.includes('lunch')));
    const dinnerRecipes = appData.recipes.filter(r => isRecipeAvailable(r) && (r.mealType === 'dinner' || r.mealType === undefined || r.tags?.includes('dinner')));
    
    const shuffledLunch = [...lunchRecipes].sort(() => Math.random() - 0.5);
    const shuffledDinner = [...dinnerRecipes].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(start); date.setDate(start.getDate() + i);
        const dk = date.toISOString().split('T')[0];
        
        if (!appData.weeklyPlan[dk]) {
            appData.weeklyPlan[dk] = { lunch: [], dinner: [] };
        } else if (Array.isArray(appData.weeklyPlan[dk])) {
            // Convert old format
            appData.weeklyPlan[dk] = { lunch: [], dinner: appData.weeklyPlan[dk] };
        }
        
        if (appData.weeklyPlan[dk].lunch.length === 0 && shuffledLunch[i % Math.max(shuffledLunch.length, 1)]) {
            appData.weeklyPlan[dk].lunch = [shuffledLunch[i % shuffledLunch.length].id];
        }
        if (appData.weeklyPlan[dk].dinner.length === 0 && shuffledDinner[i % Math.max(shuffledDinner.length, 1)]) {
            appData.weeklyPlan[dk].dinner = [shuffledDinner[i % shuffledDinner.length].id];
        }
    }
    
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    showToast('Week plan generated!', 'success'); 
    showSyncIndicator('Synced ✓'); 
    renderWeeklyView();
}

function openRecipeSelector(dk, mealSlot) { 
    selectedDayForRecipe = dk; 
    selectedMealSlot = mealSlot;
    document.getElementById('select-recipe-title').textContent = `Select ${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} Recipe`;
    renderRecipeSelector(); 
    openModal('select-recipe-modal'); 
}

function renderRecipeSelector() {
    const search = document.getElementById('recipe-selector-search')?.value?.toLowerCase() || '';
    
    // Filter by meal type preference
    let recipes = appData.recipes.filter(r => r.name.toLowerCase().includes(search));
    if (selectedMealSlot === 'lunch') {
        recipes = recipes.filter(r => r.mealType === 'lunch' || r.tags?.includes('lunch') || r.mealType === undefined);
    } else if (selectedMealSlot === 'dinner') {
        recipes = recipes.filter(r => r.mealType === 'dinner' || r.mealType === undefined || r.tags?.includes('dinner'));
    }
    
    document.getElementById('recipe-selector').innerHTML = recipes.map(r => {
        const avail = isRecipeAvailable(r), days = getDaysSinceCooked(r);
        const thumb = r.imageUrl ? `<img src="${r.imageUrl}" class="recipe-selector-thumb" onerror="this.outerHTML='<div class=recipe-selector-thumb style=display:flex;align-items:center;justify-content:center>${getRecipeEmoji(r)}</div>'">` : `<div class="recipe-selector-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">${getRecipeEmoji(r)}</div>`;
        return `<div class="recipe-selector-item ${avail?'':'unavailable'}" onclick="${avail?`selectRecipeForDay('${r.id}')`:''}">
            ${thumb}
            <div class="recipe-selector-info">
                <div class="recipe-selector-name">${r.name}</div>
                <div class="recipe-selector-meta">${avail?'✅ Available':`⏳ ${ROTATION_DAYS-days}d`} • ${(r.prepTime||0)+(r.cookTime||0)} min</div>
            </div>
        </div>`;
    }).join('');
}

function filterRecipeSelector() { renderRecipeSelector(); }

async function selectRecipeForDay(rid) {
    const dk = selectedDayForRecipe;
    const slot = selectedMealSlot;
    
    if (!appData.weeklyPlan[dk]) {
        appData.weeklyPlan[dk] = { lunch: [], dinner: [] };
    } else if (Array.isArray(appData.weeklyPlan[dk])) {
        appData.weeklyPlan[dk] = { lunch: [], dinner: appData.weeklyPlan[dk] };
    }
    
    appData.weeklyPlan[dk][slot].push(rid);
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    showToast('Added!', 'success'); 
    showSyncIndicator('Synced ✓'); 
    closeModal('select-recipe-modal'); 
    renderWeeklyView();
}

async function removeMealFromDay(dk, rid, slot) {
    if (appData.weeklyPlan[dk]) {
        if (Array.isArray(appData.weeklyPlan[dk])) {
            appData.weeklyPlan[dk] = appData.weeklyPlan[dk].filter(id => id !== rid);
        } else {
            appData.weeklyPlan[dk][slot] = appData.weeklyPlan[dk][slot].filter(id => id !== rid);
        }
        await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan); 
        showSyncIndicator('Synced ✓'); 
        renderWeeklyView();
    }
}

// ===== SHOPPING VIEW =====
function renderShoppingView() {
    const cats = generateShoppingList(), container = document.getElementById('shopping-categories');
    const cfg = { produce:{icon:'🥬',name:'Produce'}, protein:{icon:'🥩',name:'Protein'}, dairy:{icon:'🧀',name:'Dairy Alt'}, pantry:{icon:'🫙',name:'Pantry'}, spices:{icon:'🌿',name:'Spices'}, other:{icon:'📦',name:'Other'} };
    if (!Object.keys(cats).length) { container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🛒</div><h3 class="empty-state-title">Empty</h3><button class="btn btn-primary" onclick="switchView(\'weekly\')">Plan Week</button></div>'; return; }
    container.innerHTML = Object.entries(cats).map(([cat, items]) => {
        const c = cfg[cat] || cfg.other;
        return `<div class="category-card"><div class="category-header ${cat}"><span class="category-icon">${c.icon}</span><span class="category-name">${c.name}</span><span class="category-count">${items.length}</span></div><div class="category-items">${items.map(item => {
            const chk = appData.checkedItems.includes(item.id);
            return `<div class="shopping-item ${chk?'checked':''}"><div class="shopping-checkbox ${chk?'checked':''}" onclick="toggleShoppingItem('${item.id}')">${chk?'✓':''}</div><span class="shopping-item-text">${item.name}</span></div>`;
        }).join('')}</div></div>`;
    }).join('');
}

function generateShoppingList() {
    const ings = {}, cats = {};
    Object.values(appData.weeklyPlan).forEach(dayPlan => {
        let meals = [];
        if (Array.isArray(dayPlan)) {
            meals = dayPlan;
        } else {
            meals = [...(dayPlan.lunch || []), ...(dayPlan.dinner || [])];
        }
        meals.forEach(rid => {
            const r = appData.recipes.find(x => x.id === rid);
            r?.ingredients?.forEach(ing => { 
                const k = ing.toLowerCase().trim(); 
                if (!ings[k]) ings[k] = { id: Date.now().toString(36)+Math.random().toString(36).substr(2), name: ing, category: categorize(ing) }; 
            });
        });
    });
    Object.values(ings).forEach(i => { if (!cats[i.category]) cats[i.category] = []; cats[i.category].push(i); });
    return cats;
}

function categorize(i) {
    const l = i.toLowerCase();
    if (/chicken|beef|lamb|pork|fish|salmon|shrimp|cod|turkey/.test(l)) return 'protein';
    if (/goat|coconut cream|coconut milk|ghee/.test(l)) return 'dairy';
    if (/spinach|lettuce|zucchini|tomato|onion|garlic|pepper|potato|carrot|celery|basil|parsley|cilantro|mint|dill|lime|lemon|ginger/.test(l)) return 'produce';
    if (/cumin|coriander|turmeric|paprika|cinnamon|oregano|thyme|rosemary|salt|pepper/.test(l)) return 'spices';
    if (/flour|oil|honey|vinegar|sauce|sugar|broth|aminos|tapioca/.test(l)) return 'pantry';
    return 'other';
}

async function toggleShoppingItem(id) {
    const idx = appData.checkedItems.indexOf(id);
    if (idx > -1) appData.checkedItems.splice(idx, 1); else appData.checkedItems.push(id);
    await FirebaseDB.saveSettings({ checkedItems: appData.checkedItems }); renderShoppingView();
}
async function clearCheckedItems() { appData.checkedItems = []; await FirebaseDB.saveSettings({ checkedItems: [] }); showToast('Cleared', 'success'); renderShoppingView(); }
async function regenerateShoppingList() { appData.checkedItems = []; await FirebaseDB.saveSettings({ checkedItems: [] }); showToast('Regenerated!', 'success'); renderShoppingView(); }

// ===== RECIPES VIEW =====
function renderRecipesView() { updateStats(); renderAllRecipes(); initFilterChips(); }
function updateStats() {
    document.getElementById('stat-total').textContent = appData.recipes.length;
    document.getElementById('stat-available').textContent = appData.recipes.filter(isRecipeAvailable).length;
    document.getElementById('stat-favorites').textContent = appData.recipes.filter(r => r.favorite).length;
}
function renderAllRecipes() {
    const grid = document.getElementById('all-recipes-grid'), search = document.getElementById('recipe-search')?.value?.toLowerCase() || '';
    let filtered = appData.recipes.filter(r => r.name.toLowerCase().includes(search) || (r.tags||[]).some(t => t.toLowerCase().includes(search)));
    if (currentFilter === 'available') filtered = filtered.filter(isRecipeAvailable);
    else if (currentFilter === 'favorites') filtered = filtered.filter(r => r.favorite);
    else if (currentFilter === 'lunch') filtered = filtered.filter(r => r.mealType === 'lunch' || (r.tags||[]).includes('lunch'));
    else if (currentFilter === 'dinner') filtered = filtered.filter(r => r.mealType === 'dinner' || r.mealType === undefined || (r.tags||[]).includes('dinner'));
    else if (currentFilter === 'quick') filtered = filtered.filter(r => (r.prepTime||0)+(r.cookTime||0) <= 30);
    grid.innerHTML = filtered.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes</h3></div>' : filtered.map(renderRecipeCard).join('');
}

function renderRecipeCard(r) {
    const avail = isRecipeAvailable(r), days = getDaysSinceCooked(r), time = (r.prepTime||0)+(r.cookTime||0);
    const img = r.imageUrl ? `<img src="${r.imageUrl}" class="recipe-card-image" onerror="this.outerHTML='<div class=recipe-card-image-placeholder>${getRecipeEmoji(r)}</div>'">` : `<div class="recipe-card-image-placeholder">${getRecipeEmoji(r)}</div>`;
    const mealBadge = `<div class="card-meal-badge ${r.mealType || 'dinner'}">${getMealTypeEmoji(r.mealType)}</div>`;
    return `<div class="recipe-card" onclick="viewRecipeDetail('${r.id}')">
        ${!avail?`<div class="rotation-badge">${ROTATION_DAYS-days}d</div>`:r.lastCooked?'<div class="rotation-badge available">Ready</div>':''}
        ${mealBadge}
        ${img}
        <div class="recipe-card-body">
            <div class="recipe-card-header">
                <h3 class="recipe-card-name">${r.name}</h3>
                <button class="favorite-btn ${r.favorite?'favorited':''}" onclick="event.stopPropagation();toggleFavorite('${r.id}')">${r.favorite?'❤️':'🤍'}</button>
            </div>
            <div class="recipe-card-meta"><span>⏱️ ${time}m</span><span>👥 ${r.servings||4}</span></div>
            <div class="recipe-card-tags">${(r.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        </div>
    </div>`;
}

function initFilterChips() {
    document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active'); currentFilter = chip.dataset.filter; renderAllRecipes();
    }));
}
function filterRecipes() { renderAllRecipes(); }

async function toggleFavorite(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (r) { r.favorite = !r.favorite; await FirebaseDB.updateRecipe(id, { favorite: r.favorite }); showToast(r.favorite ? 'Added to favorites' : 'Removed', 'success'); showSyncIndicator('Synced ✓'); renderAllRecipes(); renderDailyView(); }
}

// ===== RECIPE DETAIL =====
function viewRecipeDetail(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (!r) return;
    const time = (r.prepTime||0)+(r.cookTime||0);
    const img = r.imageUrl ? `<img src="${r.imageUrl}" class="recipe-detail-image" onerror="this.style.display='none'">` : '';
    const mealBadge = `<span class="meal-type-badge ${r.mealType || 'dinner'}">${getMealTypeEmoji(r.mealType)} ${(r.mealType || 'dinner').charAt(0).toUpperCase() + (r.mealType || 'dinner').slice(1)}</span>`;
    
    const hasIngredients = r.ingredients && r.ingredients.length > 0;
    const hasInstructions = r.instructions && r.instructions.length > 0;
    
    let content = `${img}
        <div class="recipe-detail-header">
            <h2 class="recipe-detail-name">${r.name}</h2>
            <div class="recipe-detail-meta">
                ${mealBadge}
                <span>⏱️ ${time} min</span>
                <span>👥 ${r.servings||4}</span>
                ${r.lastCooked?`<span>📅 ${getDaysSinceCooked(r)}d ago</span>`:''}
            </div>
            ${r.sourceUrl?`<a href="${r.sourceUrl}" target="_blank" class="source-link">🔗 View Original Recipe</a>`:''}
        </div>`;
    
    if (hasIngredients) {
        content += `<div class="recipe-detail-section">
            <h3 class="recipe-detail-section-title">Ingredients</h3>
            <ul class="ingredient-list">${r.ingredients.map(i=>`<li class="ingredient-item">${i}</li>`).join('')}</ul>
        </div>`;
    }
    
    if (hasInstructions) {
        content += `<div class="recipe-detail-section">
            <h3 class="recipe-detail-section-title">Instructions</h3>
            <ol class="instruction-list">${r.instructions.map(s=>`<li class="instruction-item">${s}</li>`).join('')}</ol>
        </div>`;
    }
    
    if (!hasIngredients && !hasInstructions && r.sourceUrl) {
        content += `<div class="recipe-detail-section">
            <div class="empty-details">
                <p>📝 Recipe details not yet added.</p>
                <p>Visit the original recipe to see full ingredients and instructions, then add them here!</p>
                <a href="${r.sourceUrl}" target="_blank" class="btn btn-primary" style="margin-top: var(--space-md);">View Original Recipe</a>
            </div>
        </div>`;
    }
    
    content += `<div class="modal-footer">
        <button class="btn btn-secondary" onclick="openEditRecipeModal('${r.id}')">✏️ Edit</button>
        <button class="btn btn-danger" onclick="deleteRecipe('${r.id}')">🗑️ Delete</button>
        <button class="btn btn-primary" onclick="cookRecipe('${r.id}');closeModal('recipe-detail-modal')">🍳 Cooked</button>
    </div>`;
    
    document.getElementById('recipe-detail-content').innerHTML = content;
    openModal('recipe-detail-modal');
}

function openEditRecipeModal(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (!r) return;
    document.getElementById('edit-recipe-id').value = r.id;
    document.getElementById('edit-name').value = r.name;
    document.getElementById('edit-prepTime').value = r.prepTime || '';
    document.getElementById('edit-cookTime').value = r.cookTime || '';
    document.getElementById('edit-servings').value = r.servings || '';
    document.getElementById('edit-sourceUrl').value = r.sourceUrl || '';
    document.getElementById('edit-imageUrl').value = r.imageUrl || '';
    document.getElementById('edit-ingredients').value = (r.ingredients || []).join('\n');
    document.getElementById('edit-instructions').value = (r.instructions || []).join('\n');
    document.getElementById('edit-tags').value = (r.tags || []).join(', ');
    document.getElementById('edit-mealType').value = r.mealType || 'dinner';
    document.getElementById('edit-image-preview').innerHTML = r.imageUrl ? `<img src="${r.imageUrl}" onerror="this.style.display='none'">` : '';
    
    // Set meal type toggle
    document.querySelectorAll('#edit-meal-type-toggle .meal-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.meal === (r.mealType || 'dinner'));
    });
    
    closeModal('recipe-detail-modal'); 
    openModal('edit-recipe-modal');
}

async function handleEditRecipe(event) {
    event.preventDefault();
    const fd = new FormData(event.target), id = fd.get('id');
    const updates = { 
        name: fd.get('name'), 
        prepTime: parseInt(fd.get('prepTime'))||0, 
        cookTime: parseInt(fd.get('cookTime'))||0, 
        servings: parseInt(fd.get('servings'))||4, 
        sourceUrl: fd.get('sourceUrl')||'', 
        imageUrl: fd.get('imageUrl')||'',
        mealType: fd.get('mealType') || 'dinner',
        ingredients: fd.get('ingredients').split('\n').filter(i=>i.trim()).map(applySubstitutions),
        instructions: fd.get('instructions').split('\n').filter(i=>i.trim()),
        tags: fd.get('tags').split(',').map(t=>t.trim()).filter(t=>t)
    };
    await FirebaseDB.updateRecipe(id, updates);
    const r = appData.recipes.find(x => x.id === id);
    if (r) Object.assign(r, updates);
    closeModal('edit-recipe-modal'); showToast('Updated!', 'success'); showSyncIndicator('Synced ✓'); renderRecipesView(); renderDailyView();
}

async function deleteRecipe(id) {
    if (!confirm('Delete this recipe?')) return;
    await FirebaseDB.deleteRecipe(id);
    appData.recipes = appData.recipes.filter(r => r.id !== id);
    Object.keys(appData.weeklyPlan).forEach(k => { 
        if (Array.isArray(appData.weeklyPlan[k])) {
            appData.weeklyPlan[k] = appData.weeklyPlan[k].filter(rid => rid !== id);
        } else {
            appData.weeklyPlan[k].lunch = (appData.weeklyPlan[k].lunch || []).filter(rid => rid !== id);
            appData.weeklyPlan[k].dinner = (appData.weeklyPlan[k].dinner || []).filter(rid => rid !== id);
        }
    });
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    closeModal('recipe-detail-modal'); showToast('Deleted', 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
}

// ===== ADD RECIPE =====
async function handleAddRecipe(event) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const recipe = { 
        name: fd.get('name'), 
        prepTime: parseInt(fd.get('prepTime'))||0, 
        cookTime: parseInt(fd.get('cookTime'))||0, 
        servings: parseInt(fd.get('servings'))||4, 
        mealType: fd.get('mealType') || 'dinner',
        ingredients: fd.get('ingredients').split('\n').filter(i=>i.trim()).map(applySubstitutions), 
        instructions: fd.get('instructions').split('\n').filter(i=>i.trim()), 
        tags: fd.get('tags').split(',').map(t=>t.trim()).filter(t=>t), 
        sourceUrl: fd.get('sourceUrl')||'', 
        imageUrl: fd.get('imageUrl')||'', 
        favorite: false, 
        lastCooked: null 
    };
    const newRecipe = await FirebaseDB.addRecipe(recipe);
    appData.recipes.push(newRecipe);
    closeModal('add-recipe-modal'); showToast(`Added "${recipe.name}"!`, 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
}

// ===== URL IMPORT =====
async function importFromUrl() {
    const urlInput = document.getElementById('import-url');
    const url = urlInput.value.trim();
    const importBtn = document.getElementById('import-btn');
    
    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }
    
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    
    try {
        // Try to fetch and parse the recipe
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        const html = data.contents;
        
        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try to find JSON-LD schema
        let recipe = null;
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'Recipe') {
                    recipe = json;
                    break;
                }
                if (Array.isArray(json['@graph'])) {
                    recipe = json['@graph'].find(item => item['@type'] === 'Recipe');
                    if (recipe) break;
                }
            } catch (e) {}
        }
        
        if (recipe) {
            // Populate form with parsed data
            document.getElementById('add-name').value = recipe.name || '';
            document.getElementById('add-prepTime').value = parseTime(recipe.prepTime) || '';
            document.getElementById('add-cookTime').value = parseTime(recipe.cookTime) || '';
            document.getElementById('add-servings').value = parseServings(recipe.recipeYield) || 4;
            document.getElementById('add-sourceUrl').value = url;
            
            if (recipe.image) {
                const imgUrl = Array.isArray(recipe.image) ? recipe.image[0] : (typeof recipe.image === 'object' ? recipe.image.url : recipe.image);
                document.getElementById('add-imageUrl').value = imgUrl || '';
            }
            
            // Ingredients
            if (recipe.recipeIngredient) {
                document.getElementById('add-ingredients').value = recipe.recipeIngredient.map(applySubstitutions).join('\n');
            }
            
            // Instructions
            if (recipe.recipeInstructions) {
                let instructions = [];
                if (Array.isArray(recipe.recipeInstructions)) {
                    instructions = recipe.recipeInstructions.map(i => typeof i === 'string' ? i : i.text).filter(Boolean);
                }
                document.getElementById('add-instructions').value = instructions.join('\n');
            }
            
            // Tags
            const tags = [];
            if (recipe.recipeCategory) tags.push(...(Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory : [recipe.recipeCategory]));
            if (recipe.recipeCuisine) tags.push(...(Array.isArray(recipe.recipeCuisine) ? recipe.recipeCuisine : [recipe.recipeCuisine]));
            document.getElementById('add-tags').value = tags.join(', ');
            
            showToast('Recipe imported! Review and save.', 'success');
        } else {
            // Couldn't parse - just set the URL
            document.getElementById('add-sourceUrl').value = url;
            
            // Try to get title from page
            const title = doc.querySelector('h1, h2, .recipe-title, [class*="title"]');
            if (title) {
                document.getElementById('add-name').value = title.textContent.trim();
            }
            
            showToast('Could not auto-parse recipe. URL saved - please fill in details manually.', 'default');
        }
    } catch (error) {
        console.error('Import error:', error);
        document.getElementById('add-sourceUrl').value = url;
        showToast('Could not fetch recipe. URL saved - please fill in details manually.', 'error');
    }
    
    importBtn.disabled = false;
    importBtn.textContent = 'Import';
}

function parseTime(isoTime) {
    if (!isoTime) return 0;
    const match = isoTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
        return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
    }
    return 0;
}

function parseServings(yield_) {
    if (!yield_) return 4;
    if (typeof yield_ === 'number') return yield_;
    const match = String(yield_).match(/\d+/);
    return match ? parseInt(match[0]) : 4;
}

function applySubstitutions(ing) {
    return ing.replace(/\b(milk)\b/gi,'goat milk').replace(/\b(cream)\b(?!.*coconut)/gi,'coconut cream').replace(/\b(butter)\b(?!.*ghee)/gi,'ghee').replace(/\b(cheese)\b/gi,'goat cheese').replace(/\b(yogurt)\b/gi,'coconut yogurt').replace(/\b(vegetable oil|canola oil|sunflower oil|safflower oil|soybean oil)\b/gi,'avocado oil').replace(/\b(all-purpose flour|wheat flour|bread flour)\b/gi,'gluten-free flour').replace(/\b(soy sauce)\b/gi,'coconut aminos');
}

// ===== INIT =====
async function initializeApp() {
    try {
        const [recipes, plan, settings] = await Promise.all([FirebaseDB.initializeDefaultRecipes(), FirebaseDB.loadWeeklyPlan(), FirebaseDB.loadSettings()]);
        appData.recipes = recipes; appData.weeklyPlan = plan; appData.checkedItems = settings.checkedItems || [];
        initNavigation(); renderDailyView();
        document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) { console.error(e); showToast('Failed to load', 'error'); document.getElementById('loading-screen').classList.add('hidden'); }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initializeApp, 500));
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); });
