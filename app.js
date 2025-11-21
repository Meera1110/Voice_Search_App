let veterans = [];
let dataLoaded = false;

fetch("veterans.json")
  .then(r => r.json())
  .then(data => {
    veterans = data.veterans;
    dataLoaded = true;
    renderList(veterans);
  })
  .catch(err => {
    console.error("Error loading veterans data:", err);
    document.getElementById("list").innerHTML = "<li>Error loading data. Please refresh the page.</li>";
  });

function renderList(arr) {
  const ul = document.getElementById("list");
  ul.innerHTML = "";
  
  if (arr.length === 0) {
    ul.innerHTML = "<li>No results found.</li>";
    return;
  }
  
  arr.forEach(v => {
    const li = document.createElement("li");
    
    // Format phone numbers
    const phones = v.phones && v.phones.length > 0 
      ? v.phones.join(", ") 
      : "No phone available";
    
    // Create structured display
    li.innerHTML = `
      <div class="veteran-item">
        <div class="veteran-name"><strong>${v.name}</strong></div>
        <div class="veteran-address">📍 ${v.address}</div>
        <div class="veteran-phones">📞 ${phones}</div>
      </div>
    `;
    ul.appendChild(li);
  });
}

// Helper function to normalize strings by removing spaces and converting to lowercase
function normalizeString(str) {
  return (str || "").toLowerCase().replace(/\s+/g, "");
}

// Helper function to extract actual name from name field (removes rank prefix)
function extractActualName(nameField) {
  if (!nameField) return "";
  
  // Common rank prefixes to remove
  const rankPrefixes = [
    "lt", "lt.", "lt ", "lt. ", "lt col", "lt.col", "lt col.", "lt.col.",
    "col", "col.", "col ", "col. ", "capt", "capt.", "capt ", "capt. ",
    "maj", "maj.", "maj ", "maj. ", "brig", "brig.", "brig ", "brig. ",
    "gen", "gen.", "gen ", "gen. ", "wg cdr", "wg.cdr", "wg cdr.", "wg.cdr.",
    "squadron leader", "squadronleader", "squadron leader.", "squadronleader.",
    "commander", "commander.", "commander ", "commander. ",
    "captain", "captain.", "captain ", "captain. ",
    "admiral", "admiral.", "admiral ", "admiral. "
  ];
  
  let name = nameField.trim();
  const nameLower = name.toLowerCase();
  
  // Try to remove rank prefix
  for (const prefix of rankPrefixes) {
    if (nameLower.startsWith(prefix)) {
      name = name.substring(prefix.length).trim();
      // Remove any remaining rank abbreviations at the start
      name = name.replace(/^[A-Z]{1,4}\s+/, "").trim();
      break;
    }
  }
  
  // Remove common rank patterns like "LT ", "COL ", etc. at the start
  name = name.replace(/^[A-Z]{1,4}\s+/, "").trim();
  
  return name || nameField; // Fallback to original if nothing left
}

function filterList(q = null) {
  if (!dataLoaded) {
    document.getElementById("list").innerHTML = "<li>Loading data...</li>";
    return;
  }
  
  const query = (q || document.getElementById("search").value).trim();
  
  if (!query) {
    renderList(veterans);
    return;
  }
  
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  
  // First word should be ServiceType, rest should be name
  let filtered;
  
  if (words.length >= 2) {
    // Parse ServiceType (first word) and name (remaining words)
    const serviceType = words[0];
    const nameParts = words.slice(1).join(" ");
    const normalizedNameQuery = normalizeString(nameParts);
    
    filtered = veterans.filter(v => {
      const matchesServiceType = v.serviceType && 
        v.serviceType.toLowerCase().includes(serviceType);
      
      // Extract actual name (without rank) and normalize for comparison
      const actualName = extractActualName(v.name);
      const normalizedActualName = normalizeString(actualName);
      
      // Compare names without spaces to handle "RAVISHANKAR" vs "Ravi Shankar"
      const matchesName = normalizedActualName.includes(normalizedNameQuery);
      
      return matchesServiceType && matchesName;
    });
  } else {
    // Fallback: search only in name field (not address) if only one word provided
    const normalizedQuery = normalizeString(query);
    filtered = veterans.filter(v => {
      // Extract actual name and search only in that
      const actualName = extractActualName(v.name);
      const normalizedActualName = normalizeString(actualName);
      
      return normalizedActualName.includes(normalizedQuery);
    });
  }
  
  renderList(filtered);
}

function startVoice() {
  if (!dataLoaded) {
    alert("Please wait for data to load...");
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in your browser.");
    return;
  }
  
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  
  rec.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    document.getElementById("heard").innerText = "Heard: " + spoken;
    filterList(spoken);
  };
  
  rec.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    document.getElementById("heard").innerText = "Error: " + event.error;
  };
  
  rec.onend = () => {
    // Recognition ended
  };
  
  rec.start();
}
