// Vercel serverless environment uses native fetch

// Demo knowledge base for responses
const demoResponses = {
  'inheritance': `**Inheritance** is a core OOP concept where a class (child/subclass) derives properties and methods from another class (parent/superclass).

**Example in Python:**
\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "Some sound"

class Dog(Animal):
    def speak(self):
        return f"{self.name} says: Woof!"

d = Dog("Rex")
print(d.speak())  # Rex says: Woof!
\`\`\`

**Types:** Single, Multiple, Multilevel, Hierarchical, Hybrid.
**Benefits:** Code reuse, extensibility, polymorphism.`,

  'polymorphism': `**Polymorphism** means "many forms" — the same method name behaves differently based on the object.

**Two types:**
1. **Compile-time** (Method Overloading)
2. **Runtime** (Method Overriding)

\`\`\`python
class Shape:
    def area(self): return 0

class Circle(Shape):
    def area(self): return 3.14 * 5 * 5

for s in [Circle()]:
    print(s.area())
\`\`\``,

  'encapsulation': `**Encapsulation** bundles data + methods together and restricts direct access using access modifiers.

\`\`\`python
class BankAccount:
    def __init__(self):
        self.__balance = 0

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount

    def get_balance(self):
        return self.__balance
\`\`\`

**Benefits:** Data protection, cleaner interfaces, easier debugging.`,

  'python': `**Python** is a high-level, interpreted, general-purpose language known for its clean syntax.

**Key features:**
- Easy to read and write
- Dynamically typed
- Huge library ecosystem (NumPy, Pandas, Django, Flask)

**Basic syntax:**
\`\`\`python
# Variables
name = "Alice"
age = 25

# Function
def greet(name):
    return f"Hello, {name}!"

# List comprehension
squares = [x**2 for x in range(1, 6)]
print(squares)  # [1, 4, 9, 16, 25]
\`\`\``,

  'javascript': `**JavaScript** is the language of the web — runs in browsers and on servers (Node.js).

\`\`\`javascript
// Arrow function
const greet = (name) => \`Hello, \${name}!\`;

// Promises / Async-Await
async function fetchData(url) {
    const res = await fetch(url);
    const data = await res.json();
    return data;
}
\`\`\`

**Key topics:** DOM manipulation, ES6+, async/await, closures, prototypes.`,

  'recursion': `**Recursion** is when a function calls itself to solve a smaller version of the same problem.

\`\`\`javascript
function sum(n) {
    if (n === 1) return 1;  // base case
    return n + sum(n - 1);
}
console.log(sum(5)); // 15
\`\`\`

**Rules:** Always have a base case to stop.`,

  'git': `**Git** is a distributed version control system.

**Essential commands:**
\`\`\`bash
git init              # Initialize a repository
git clone <url>       # Clone remote repo
git add .             # Stage all changes
git commit -m "msg"   # Save snapshot
git push origin main  # Push to GitHub
git pull              # Get latest changes
git branch feature    # Create a branch
git checkout feature  # Switch to branch
\`\`\``
};

function getDemoResponse(question) {
  const q = question.toLowerCase();
  for (const [key, response] of Object.entries(demoResponses)) {
    if (q.includes(key)) {
      return response;
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'DEMO_MODE';
    const isValidKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'DEMO_MODE' && GEMINI_API_KEY !== 'PUT_YOUR_SECRET_KEY_HERE';
    
    // If no valid API key, use demo mode
    if (!isValidKey) {
      const userMessage = req.body.contents[req.body.contents.length - 1]?.parts[0]?.text || '';
      const demoResponse = getDemoResponse(userMessage);
      
      if (demoResponse) {
        return res.status(200).json({
          candidates: [{
            content: {
              parts: [{ text: demoResponse }]
            }
          }]
        });
      } else {
        return res.status(200).json({
          candidates: [{
            content: {
              parts: [{ text: `**Demo Mode:** I can help with these topics:\n\n• Inheritance\n• Polymorphism\n• Encapsulation\n• Python\n• JavaScript\n• Recursion\n• Git\n\nTry asking about any of these topics! For full AI responses, add a Gemini API key to your environment variables.` }]
            }
          }]
        });
      }
    }

    // Use real API if key exists
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        }
      );
      const data = await response.json();
      res.status(200).json(data);
    } catch (apiError) {
      // Fall back to demo mode if API fails
      const userMessage = req.body.contents[req.body.contents.length - 1]?.parts[0]?.text || '';
      const demoResponse = getDemoResponse(userMessage);
      if (demoResponse) {
        return res.status(200).json({
          candidates: [{
            content: {
              parts: [{ text: demoResponse }]
            }
          }]
        });
      }
      throw apiError;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
