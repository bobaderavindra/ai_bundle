import { useState } from "react";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const QUICK_PROMPTS = [
  {
    id: "arch",
    label: "System Architecture",
    text: "Provide system architecture for the recipe chatbot."
  },
  {
    id: "schema",
    label: "Database Schema",
    text: "Provide database schema for the recipe chatbot."
  },
  {
    id: "api",
    label: "Backend APIs",
    text: "Provide backend API design with endpoints."
  },
  {
    id: "ui",
    label: "Frontend UI",
    text: "Provide frontend UI layout plan."
  },
  {
    id: "prompt",
    label: "AI Prompts",
    text: "Provide AI prompt design for the chef assistant."
  },
  {
    id: "deploy",
    label: "Deployment",
    text: "Provide deployment steps for Docker and cloud."
  }
];

const BLUEPRINT_RESPONSES = {
  architecture: `System Architecture
- Frontend: React app with chat UI, recipe cards, filters, and meal planner.
- Backend: FastAPI service with Chat API, Recipe API, Profile API, and Planner API.
- AI Layer: LLM adapter with prompt templates, memory, and tool routing.
- Data: PostgreSQL for users, preferences, chat history, favorites, meal plans.
- Integrations: Optional Spoonacular/Edamam for recipes and nutrition.
- Observability: API logs, prompt traces, and cache metrics.`,
  schema: `Database Schema
- users(id, email, name, created_at)
- user_profiles(user_id, diet, allergies, taste_prefs, cuisine_prefs, skill_level)
- chat_sessions(id, user_id, created_at)
- chat_messages(id, session_id, role, content, created_at)
- recipes(id, title, cuisine, diet_tags, ingredients_json, steps_json, nutrition_json)
- favorites(user_id, recipe_id, created_at)
- meal_plans(id, user_id, week_start, calories_target)
- meal_plan_items(id, plan_id, day, meal_type, recipe_id)
- grocery_lists(id, plan_id, items_json, created_at)`,
  api: `Backend APIs
- POST /api/chat: {message, sessionId, preferences} -> {reply, sessionId}
- GET /api/recipes/search?ingredients=&cuisine=&diet=&time=&skill=
- GET /api/recipes/{id}
- POST /api/profile: {diet, allergies, preferences}
- GET /api/profile
- POST /api/favorites/{recipeId}
- GET /api/favorites
- POST /api/meal-plans: {weekStart, caloriesTarget}
- POST /api/meal-plans/{id}/generate
- GET /api/meal-plans/{id}
- GET /api/meal-plans/{id}/grocery-list`,
  ui: `Frontend UI Layout
- Left panel: profile, diet filters, cuisine selector, quick actions.
- Center: chat timeline with recipe cards and structured responses.
- Right drawer (optional): saved recipes and meal planner summary.
- Input dock: multi-line prompt, attachments, and voice controls.`,
  prompt: `AI Prompt Design
System: You are a friendly chef assistant. Provide structured recipe answers.
User context: diet, allergies, time, cuisine, skill level, pantry.
Tools: recipe search, nutrition lookup, meal planner, grocery generator.
Response format:
Recipe Name:
Preparation Time:
Ingredients:
Steps:
Tips:
Nutrition:`,
  deploy: `Deployment Steps
1. Build frontend and serve via Nginx.
2. Containerize FastAPI with Uvicorn.
3. Use Postgres container and optional Redis cache.
4. Compose with Docker for local.
5. Deploy to cloud: container registry + managed Postgres.
6. Add HTTPS, secrets manager, and monitoring.`
};

const WELCOME_MESSAGE =
  "Hi, I am your chef assistant. Ask for recipes, meal plans, or click a blueprint step to generate the system design.";

export default function RecipeChatbotDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("None");
  const [cuisine, setCuisine] = useState("Any");
  const [skill, setSkill] = useState("Intermediate");
  const [time, setTime] = useState("30");

  function pushMessage(role: ChatRole, content: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content }]);
  }

  function buildRecipeResponse(text: string) {
    const normalized = text.toLowerCase();
    if (normalized.includes("architecture")) return BLUEPRINT_RESPONSES.architecture;
    if (normalized.includes("schema")) return BLUEPRINT_RESPONSES.schema;
    if (normalized.includes("api")) return BLUEPRINT_RESPONSES.api;
    if (normalized.includes("frontend")) return BLUEPRINT_RESPONSES.ui;
    if (normalized.includes("prompt")) return BLUEPRINT_RESPONSES.prompt;
    if (normalized.includes("deploy")) return BLUEPRINT_RESPONSES.deploy;

    const ingredients = normalized.includes("potato")
      ? "Potato, Tomato, Onion, Garlic, Olive oil"
      : "Chicken, Garlic, Lemon, Olive oil, Herbs";
    const recipeName = normalized.includes("vegetarian") ? "Rustic Veggie Skillet" : "Lemon Herb Chicken";
    const cuisineTag = cuisine === "Any" ? "Global" : cuisine;

    return `Recipe Name: ${recipeName} (${cuisineTag})
Preparation Time: ${time} minutes
Ingredients: ${ingredients}
Steps:
1. Prep ingredients and heat a pan with oil.
2. Saute aromatics, then add main ingredients.
3. Season, cover, and simmer until tender.
4. Finish with herbs and serve warm.
Tips:
- Adjust spice level to your taste.
- Add a splash of citrus for brightness.
Nutrition: Approx 380 kcal per serving.`;
  }

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage("user", trimmed);
    const response = buildRecipeResponse(trimmed);
    pushMessage("assistant", response);
    setInput("");
  }

  return (
    <section className="chef-ai-shell">
      <aside className="chef-ai-panel">
        <div className="chef-ai-brand">
          <span>ChefGPT</span>
          <small>Recipe Intelligence</small>
        </div>
        <section className="chef-ai-block">
          <h4>Profile</h4>
          <label>
            Diet
            <select value={diet} onChange={(event) => setDiet(event.target.value)}>
              <option>None</option>
              <option>Vegetarian</option>
              <option>Vegan</option>
              <option>Keto</option>
              <option>Gluten-Free</option>
            </select>
          </label>
          <label>
            Cuisine
            <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
              <option>Any</option>
              <option>Indian</option>
              <option>Italian</option>
              <option>Chinese</option>
              <option>Mexican</option>
            </select>
          </label>
          <label>
            Skill Level
            <select value={skill} onChange={(event) => setSkill(event.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label>
            Max Cook Time (mins)
            <input value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </section>

        <section className="chef-ai-block">
          <h4>Blueprint Steps</h4>
          <div className="chef-ai-quick-actions">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt.id} type="button" onClick={() => handleSend(prompt.text)}>
                {prompt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="chef-ai-block">
          <h4>Meal Planner</h4>
          <p>Generate a weekly plan and grocery list.</p>
          <button type="button" onClick={() => handleSend("Plan my meals for a week under 2000 calories")}>
            Generate Plan
          </button>
        </section>
      </aside>

      <div className="chef-ai-chat">
        <header className="chef-ai-header">
          <div>
            <h2>Recipe Assistant</h2>
            <p>Friendly, step-by-step cooking guidance.</p>
          </div>
          <div className="chef-ai-tags">
            <span>{diet}</span>
            <span>{cuisine}</span>
            <span>{skill}</span>
          </div>
        </header>

        <div className="chef-ai-messages">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chef-ai-message chef-ai-message-${message.role}`}
            >
              <div>
                <pre>{message.content}</pre>
              </div>
            </article>
          ))}
        </div>

        <form
          className="chef-ai-input"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend(input);
          }}
        >
          <textarea
            rows={3}
            placeholder="Ask for recipes, meal plans, or cooking steps..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="chef-ai-input-actions">
            <button type="submit">Send</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setMessages([{ id: "welcome", role: "assistant", content: WELCOME_MESSAGE }])}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
