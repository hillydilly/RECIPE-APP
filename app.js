// ===== APP STATE =====
const ROTATION_DAYS = 21;
let currentWeekOffset = 0;
let selectedDayForRecipe = null;
let currentFilter = 'all';
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

// ===== DEFAULT RECIPES =====
function getDefaultRecipes() {
    return [
        { name: 'Honey Garlic Salmon', prepTime: 10, cookTime: 20, servings: 4, ingredients: ['2 lbs salmon fillets', '4 tbsp olive oil', '4 cloves garlic, minced', '3 tbsp honey', '2 tbsp coconut aminos', '1 tsp fresh ginger', 'Salt and pepper', 'Fresh parsley'], instructions: ['Preheat oven to 400°F.', 'Whisk oil, garlic, honey, coconut aminos, ginger.', 'Place salmon on lined baking sheet.', 'Pour mixture over salmon.', 'Bake 15-20 minutes.', 'Garnish with parsley.'], tags: ['dinner', 'seafood', 'quick'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Thai Basil Chicken', prepTime: 15, cookTime: 15, servings: 4, ingredients: ['1.5 lbs chicken thighs', '3 tbsp avocado oil', '6 cloves garlic', '3 Thai chilies', '2 cups Thai basil', '3 tbsp coconut aminos', '1 tbsp fish sauce'], instructions: ['Heat oil in wok.', 'Add garlic and chilies.', 'Add chicken, stir-fry.', 'Add sauces.', 'Toss in basil.', 'Serve over rice.'], tags: ['dinner', 'chicken', 'asian', 'spicy'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Mediterranean Lamb Meatballs', prepTime: 20, cookTime: 25, servings: 4, ingredients: ['1.5 lbs ground lamb', '1/4 cup almond flour', '1 egg', '4 cloves garlic', '2 tsp cumin', '1 tsp coriander', 'Mint and parsley'], instructions: ['Preheat oven to 400°F.', 'Mix all ingredients.', 'Form meatballs.', 'Bake 20-25 minutes.', 'Serve with tahini.'], tags: ['dinner', 'lamb', 'mediterranean'], favorite: false, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Crispy Coconut Shrimp', prepTime: 15, cookTime: 10, servings: 4, ingredients: ['1 lb large shrimp', '1 cup shredded coconut', '1/2 cup tapioca flour', '2 eggs', 'Avocado oil'], instructions: ['Set up breading station.', 'Season shrimp.', 'Dredge, dip, coat.', 'Fry until golden.', 'Serve with chili sauce.'], tags: ['dinner', 'seafood', 'crispy'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Tuscan Chicken Skillet', prepTime: 10, cookTime: 25, servings: 4, ingredients: ['4 chicken breasts', '1 cup coconut cream', '1/2 cup sun-dried tomatoes', '3 cups spinach', '4 cloves garlic', '2 tbsp olive oil'], instructions: ['Season chicken.', 'Sear until golden.', 'Sauté garlic and tomatoes.', 'Add coconut cream.', 'Return chicken, add spinach.', 'Cook through.'], tags: ['dinner', 'chicken', 'italian'], favorite: false, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Korean BBQ Beef Bowl', prepTime: 15, cookTime: 15, servings: 4, ingredients: ['1.5 lbs beef sirloin', '1/4 cup coconut aminos', '2 tbsp sesame oil', '3 tbsp honey', '4 cloves garlic', 'Green onions'], instructions: ['Mix marinade.', 'Marinate beef.', 'Cook until caramelized.', 'Serve over rice.', 'Top with green onions.'], tags: ['dinner', 'beef', 'asian', 'bowl'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Herb Roasted Chicken Thighs', prepTime: 10, cookTime: 40, servings: 4, ingredients: ['8 chicken thighs', '3 tbsp olive oil', '4 cloves garlic', '2 tbsp rosemary', '2 tbsp thyme', '1 lemon'], instructions: ['Preheat oven to 425°F.', 'Mix oil, garlic, herbs, lemon.', 'Rub on chicken.', 'Season.', 'Roast 35-40 minutes.'], tags: ['dinner', 'chicken', 'roasted'], favorite: false, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Zucchini Noodle Pad Thai', prepTime: 20, cookTime: 10, servings: 4, ingredients: ['4 zucchini, spiralized', '1 lb shrimp', '3 eggs', '1 cup bean sprouts', '1/4 cup tamarind paste', '3 tbsp coconut aminos', 'Peanuts, lime'], instructions: ['Make sauce.', 'Cook protein.', 'Scramble eggs.', 'Add zoodles and sauce.', 'Add protein and sprouts.', 'Serve with lime.'], tags: ['dinner', 'asian', 'low-carb'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Moroccan Chickpea Stew', prepTime: 15, cookTime: 30, servings: 6, ingredients: ['2 cans chickpeas', '1 can diced tomatoes', '2 cups vegetable broth', '1 large sweet potato', '2 tsp cumin', '1 tsp turmeric', 'Cilantro'], instructions: ['Sauté onion and garlic.', 'Add spices.', 'Add vegetables and broth.', 'Simmer 25-30 minutes.', 'Serve with cilantro.'], tags: ['dinner', 'vegetarian', 'stew'], favorite: false, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Garlic Butter Steak Bites', prepTime: 10, cookTime: 10, servings: 4, ingredients: ['2 lbs sirloin, cubed', '4 tbsp ghee', '6 cloves garlic', '2 tbsp rosemary', '1 tbsp thyme', 'Parsley'], instructions: ['Season steak.', 'Heat cast iron.', 'Sear in batches.', 'Add ghee, garlic, herbs.', 'Toss and cook.', 'Garnish.'], tags: ['dinner', 'beef', 'quick', 'keto'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Lemon Herb Baked Cod', prepTime: 10, cookTime: 15, servings: 4, ingredients: ['4 cod fillets', '3 tbsp olive oil', '2 lemons', '4 cloves garlic', '2 tbsp fresh dill', '1 tbsp capers'], instructions: ['Preheat oven to 400°F.', 'Place cod on sheet.', 'Drizzle with oil and lemon.', 'Top with dill and capers.', 'Bake 12-15 minutes.'], tags: ['dinner', 'seafood', 'healthy'], favorite: false, lastCooked: null, sourceUrl: '', imageUrl: '' },
        { name: 'Cashew Chicken Lettuce Wraps', prepTime: 15, cookTime: 15, servings: 4, ingredients: ['1.5 lbs ground chicken', '1 cup cashews', '1 head butter lettuce', '3 tbsp coconut aminos', '2 tbsp rice vinegar', '1 tbsp sesame oil', 'Green onions'], instructions: ['Brown chicken.', 'Add water chestnuts.', 'Add sauces.', 'Stir in cashews.', 'Serve in lettuce cups.', 'Top with green onions.'], tags: ['dinner', 'chicken', 'low-carb', 'asian'], favorite: true, lastCooked: null, sourceUrl: '', imageUrl: '' }
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
    if (t.includes('vegetarian')) return '🥗';
    return '🍽️';
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
function openAddRecipeModal() { document.getElementById('add-recipe-form').reset(); openModal('add-recipe-modal'); }

// ===== DAILY VIEW =====
function renderDailyView() {
    document.getElementById('current-date').textContent = formatDate(new Date());
    const avail = appData.recipes.filter(isRecipeAvailable);
    const s = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : appData.recipes[0];
    const el = document.getElementById('daily-suggestion');
    if (!s) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes yet</h3><button class="btn btn-primary" onclick="openAddRecipeModal()">Add Recipe</button></div>'; return; }
    const time = (s.prepTime||0) + (s.cookTime||0);
    const img = s.imageUrl ? `<img src="${s.imageUrl}" class="suggestion-image" onerror="this.style.display='none'">` : '';
    el.innerHTML = `<div class="suggestion-content">${img}<div class="suggestion-details">
        <div class="suggestion-label"><span>✨</span> Today's Suggestion</div>
        <h2 class="suggestion-recipe-name">${s.name}</h2>
        <div class="suggestion-meta"><span class="meta-item">⏱️ ${time} min</span><span class="meta-item">👥 ${s.servings||4}</span>${s.lastCooked?`<span class="meta-item">📅 ${getDaysSinceCooked(s)} days ago</span>`:''}</div>
        <div class="suggestion-tags">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}<span class="tag dietary">Dairy-free</span><span class="tag dietary">Wheat-free</span></div>
        ${s.sourceUrl?`<a href="${s.sourceUrl}" target="_blank" class="source-link" onclick="event.stopPropagation()">🔗 View Original Recipe</a>`:''}
        <div class="suggestion-actions" style="margin-top:var(--space-md)"><button class="btn btn-primary btn-large" onclick="cookRecipe('${s.id}')">🍳 Cook This</button><button class="btn btn-secondary btn-large" onclick="viewRecipeDetail('${s.id}')">View Recipe</button><button class="btn btn-secondary btn-large" onclick="renderDailyView();showToast('New suggestion!','success')">🔄 Different</button></div>
    </div></div>`;
    const fg = document.getElementById('favorites-grid');
    const fav = appData.recipes.filter(r => r.favorite);
    fg.innerHTML = fav.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">💝</div><h3 class="empty-state-title">No favorites</h3></div>' : fav.map(renderRecipeCard).join('');
}

async function cookRecipe(id) {
    const r = appData.recipes.find(x => x.id === id);
    if (r) { r.lastCooked = new Date().toISOString(); await FirebaseDB.updateRecipe(id, { lastCooked: r.lastCooked }); showToast(`Marked "${r.name}" as cooked!`, 'success'); showSyncIndicator('Synced ✓'); renderDailyView(); }
}

// ===== WEEKLY VIEW =====
function renderWeeklyView() {
    const today = new Date(), start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    document.getElementById('week-title').textContent = currentWeekOffset === 0 ? 'This Week' : `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${end.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    document.getElementById('week-grid').innerHTML = days.map((d,i) => {
        const date = new Date(start); date.setDate(start.getDate() + i);
        const dk = date.toISOString().split('T')[0], isToday = date.toDateString() === today.toDateString();
        const meals = appData.weeklyPlan[dk] || [];
        return `<div class="day-card ${isToday?'today':''}"><div class="day-header"><div class="day-name">${d}</div><div class="day-date">${date.getDate()}</div></div><div class="day-content">${meals.map(rid=>{const r=appData.recipes.find(x=>x.id===rid);return r?`<div class="day-meal" onclick="viewRecipeDetail('${r.id}')"><span class="day-meal-name">${r.name}</span><button class="day-meal-remove" onclick="event.stopPropagation();removeMealFromDay('${dk}','${r.id}')">✕</button></div>`:''}).join('')}<button class="day-add-btn" onclick="openRecipeSelector('${dk}')">+ Add</button></div></div>`;
    }).join('');
}
function changeWeek(o) { currentWeekOffset += o; renderWeeklyView(); }

async function generateWeeklyPlan() {
    const today = new Date(), start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7);
    const avail = appData.recipes.filter(isRecipeAvailable), shuffled = [...avail].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 7; i++) {
        const date = new Date(start); date.setDate(start.getDate() + i);
        const dk = date.toISOString().split('T')[0];
        if (!appData.weeklyPlan[dk]?.length && shuffled[i % shuffled.length]) appData.weeklyPlan[dk] = [shuffled[i % shuffled.length].id];
    }
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    showToast('Week plan generated!', 'success'); showSyncIndicator('Synced ✓'); renderWeeklyView();
}

function openRecipeSelector(dk) { selectedDayForRecipe = dk; renderRecipeSelector(); openModal('select-recipe-modal'); }
function renderRecipeSelector() {
    const search = document.getElementById('recipe-selector-search')?.value?.toLowerCase() || '';
    document.getElementById('recipe-selector').innerHTML = appData.recipes.filter(r => r.name.toLowerCase().includes(search)).map(r => {
        const avail = isRecipeAvailable(r), days = getDaysSinceCooked(r);
        const thumb = r.imageUrl ? `<img src="${r.imageUrl}" class="recipe-selector-thumb" onerror="this.outerHTML='<div class=recipe-selector-thumb style=display:flex;align-items:center;justify-content:center>${getRecipeEmoji(r)}</div>'">` : `<div class="recipe-selector-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">${getRecipeEmoji(r)}</div>`;
        return `<div class="recipe-selector-item ${avail?'':'unavailable'}" onclick="${avail?`selectRecipeForDay('${r.id}')`:''}"><div class="recipe-selector-info"><div class="recipe-selector-name">${r.name}</div><div class="recipe-selector-meta">${avail?'✅ Available':`⏳ ${ROTATION_DAYS-days}d`} • ${(r.prepTime||0)+(r.cookTime||0)} min</div></div></div>`;
    }).join('');
}
function filterRecipeSelector() { renderRecipeSelector(); }

async function selectRecipeForDay(rid) {
    if (!appData.weeklyPlan[selectedDayForRecipe]) appData.weeklyPlan[selectedDayForRecipe] = [];
    appData.weeklyPlan[selectedDayForRecipe].push(rid);
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    showToast('Added!', 'success'); showSyncIndicator('Synced ✓'); closeModal('select-recipe-modal'); renderWeeklyView();
}

async function removeMealFromDay(dk, rid) {
    if (appData.weeklyPlan[dk]) {
        appData.weeklyPlan[dk] = appData.weeklyPlan[dk].filter(id => id !== rid);
        await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan); showSyncIndicator('Synced ✓'); renderWeeklyView();
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
    Object.values(appData.weeklyPlan).forEach(meals => meals.forEach(rid => {
        const r = appData.recipes.find(x => x.id === rid);
        r?.ingredients?.forEach(ing => { const k = ing.toLowerCase().trim(); if (!ings[k]) ings[k] = { id: Date.now().toString(36)+Math.random().toString(36).substr(2), name: ing, category: categorize(ing) }; });
    }));
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
    let filtered = appData.recipes.filter(r => r.name.toLowerCase().includes(search) || r.tags.some(t => t.toLowerCase().includes(search)));
    if (currentFilter === 'available') filtered = filtered.filter(isRecipeAvailable);
    else if (currentFilter === 'favorites') filtered = filtered.filter(r => r.favorite);
    else if (currentFilter === 'quick') filtered = filtered.filter(r => (r.prepTime||0)+(r.cookTime||0) <= 30);
    grid.innerHTML = filtered.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📖</div><h3 class="empty-state-title">No recipes</h3></div>' : filtered.map(renderRecipeCard).join('');
}

function renderRecipeCard(r) {
    const avail = isRecipeAvailable(r), days = getDaysSinceCooked(r), time = (r.prepTime||0)+(r.cookTime||0);
    const img = r.imageUrl ? `<img src="${r.imageUrl}" class="recipe-card-image" onerror="this.outerHTML='<div class=recipe-card-image-placeholder>${getRecipeEmoji(r)}</div>'">` : `<div class="recipe-card-image-placeholder">${getRecipeEmoji(r)}</div>`;
    return `<div class="recipe-card" onclick="viewRecipeDetail('${r.id}')">${!avail?`<div class="rotation-badge">${ROTATION_DAYS-days}d</div>`:r.lastCooked?'<div class="rotation-badge available">Ready</div>':''}${img}<div class="recipe-card-body"><div class="recipe-card-header"><h3 class="recipe-card-name">${r.name}</h3><button class="favorite-btn ${r.favorite?'favorited':''}" onclick="event.stopPropagation();toggleFavorite('${r.id}')">${r.favorite?'❤️':'🤍'}</button></div><div class="recipe-card-meta"><span>⏱️ ${time}m</span><span>👥 ${r.servings||4}</span></div><div class="recipe-card-tags">${r.tags.slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div></div>`;
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
    document.getElementById('recipe-detail-content').innerHTML = `${img}<div class="recipe-detail-header"><h2 class="recipe-detail-name">${r.name}</h2><div class="recipe-detail-meta"><span>⏱️ ${time} min</span><span>👥 ${r.servings||4}</span>${r.lastCooked?`<span>📅 ${getDaysSinceCooked(r)}d ago</span>`:''}</div>${r.sourceUrl?`<a href="${r.sourceUrl}" target="_blank" class="source-link">🔗 View Original Recipe</a>`:''}</div><div class="recipe-detail-section"><h3 class="recipe-detail-section-title">Ingredients</h3><ul class="ingredient-list">${r.ingredients.map(i=>`<li class="ingredient-item">${i}</li>`).join('')}</ul></div><div class="recipe-detail-section"><h3 class="recipe-detail-section-title">Instructions</h3><ol class="instruction-list">${r.instructions.map(s=>`<li class="instruction-item">${s}</li>`).join('')}</ol></div><div class="modal-footer"><button class="btn btn-secondary" onclick="openEditRecipeModal('${r.id}')">✏️ Edit</button><button class="btn btn-danger" onclick="deleteRecipe('${r.id}')">🗑️ Delete</button><button class="btn btn-primary" onclick="cookRecipe('${r.id}');closeModal('recipe-detail-modal')">🍳 Cooked</button></div>`;
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
    document.getElementById('edit-image-preview').innerHTML = r.imageUrl ? `<img src="${r.imageUrl}" onerror="this.style.display='none'">` : '';
    closeModal('recipe-detail-modal'); openModal('edit-recipe-modal');
}

async function handleEditRecipe(event) {
    event.preventDefault();
    const fd = new FormData(event.target), id = fd.get('id');
    const updates = { name: fd.get('name'), prepTime: parseInt(fd.get('prepTime'))||0, cookTime: parseInt(fd.get('cookTime'))||0, servings: parseInt(fd.get('servings'))||4, sourceUrl: fd.get('sourceUrl')||'', imageUrl: fd.get('imageUrl')||'' };
    await FirebaseDB.updateRecipe(id, updates);
    const r = appData.recipes.find(x => x.id === id);
    if (r) Object.assign(r, updates);
    closeModal('edit-recipe-modal'); showToast('Updated!', 'success'); showSyncIndicator('Synced ✓'); renderRecipesView(); renderDailyView();
}

async function deleteRecipe(id) {
    if (!confirm('Delete this recipe?')) return;
    await FirebaseDB.deleteRecipe(id);
    appData.recipes = appData.recipes.filter(r => r.id !== id);
    Object.keys(appData.weeklyPlan).forEach(k => { appData.weeklyPlan[k] = appData.weeklyPlan[k].filter(rid => rid !== id); });
    await FirebaseDB.saveWeeklyPlan(appData.weeklyPlan);
    closeModal('recipe-detail-modal'); showToast('Deleted', 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
}

// ===== ADD RECIPE =====
async function handleAddRecipe(event) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const recipe = { name: fd.get('name'), prepTime: parseInt(fd.get('prepTime'))||0, cookTime: parseInt(fd.get('cookTime'))||0, servings: parseInt(fd.get('servings'))||4, ingredients: fd.get('ingredients').split('\n').filter(i=>i.trim()).map(applySubstitutions), instructions: fd.get('instructions').split('\n').filter(i=>i.trim()), tags: fd.get('tags').split(',').map(t=>t.trim()).filter(t=>t), sourceUrl: fd.get('sourceUrl')||'', imageUrl: fd.get('imageUrl')||'', favorite: false, lastCooked: null };
    const newRecipe = await FirebaseDB.addRecipe(recipe);
    appData.recipes.push(newRecipe);
    closeModal('add-recipe-modal'); showToast(`Added "${recipe.name}"!`, 'success'); showSyncIndicator('Synced ✓'); renderRecipesView();
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
