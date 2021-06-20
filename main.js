window.onload = () => {
    // Handle the NoJS elements
    document.querySelector("body > .no-js").setAttribute("hidden", true);
    document.querySelector("body > .content").removeAttribute("hidden");

    // Set handlers for tabbed content
    document.querySelectorAll("nav.tabs > ul > li").forEach((li, i) => {
        li.addEventListener("click", (ev) => setTabVisibility(i));
    });

    setTabVisibility(0);
};

// Change class of tabs and visibility of the related sections
function setTabVisibility(index) {
    document.querySelectorAll("nav.tabs > ul > li").forEach((li, i) => {
        li.classList.toggle("selected", index == i);
    });

    document.querySelectorAll(".tabbed > section").forEach((section, i) => {
        section.toggleAttribute("hidden", index != i);
    });
}

function handleFiles(files) {
    if (files.length > 0) {
        files[0].text().then(xmlData => {
            var parser = new DOMParser();
            buildFromXML(parser.parseFromString(xmlData, "application/xml"), files[0].name);
            document.querySelector(".content > header").classList.remove("no-save");
        });
    }
}

function buildFromXML(xml, filename) {
    var root = xml.documentElement.nodeName;
    var type = "Unknown";

    // Detect save type and check if it's correct
    if (root == "SaveGame") {
        let name = xml.querySelector(":scope > player > farmName").textContent;
        type = `World save (${name} Farm)`;
    } else if (root == "Farmer") {
        let name = xml.querySelector(":scope > name").textContent;
        type = `Farmhand save (${name})`;
    }
    document.getElementById("save_type").textContent = type;
    if (type == "Unknown") return;

    // Build section for new levels
    {
        const SKILLS = ["Farming", "Mining", "Foraging", "Fishing", "Combat"];

        let nodes = [];
        if (root == "SaveGame") {
            nodes.push(xml.querySelector(":scope > player"));
            nodes = nodes.concat(...xml.querySelectorAll(":scope > locations > GameLocation > buildings > Building > indoors > farmhand"));
        } else {
            nodes.push(xml);
        }

        let ul = document.getElementById("newlvl-players");
        // Clear all children
        while (ul.firstChild) ul.removeChild(ul.firstChild);

        nodes.forEach(node => {
            let li = document.createElement("li");
            let spanName = document.createElement("span");
            spanName.classList.add("name");
            spanName.textContent = node.querySelector(":scope > name").textContent;
            li.appendChild(spanName);
            let spanLevels = document.createElement("span");
            spanLevels.classList.add("newlvl");

            let msg = "";
            node.querySelectorAll(":scope > newLevels > Point").forEach(point => {
                if (msg.length > 0) msg += ", ";
                msg += SKILLS[+point.querySelector("X").textContent];
                msg += " " + point.querySelector("Y").textContent;
            });

            spanLevels.textContent = msg == "" ? "all clear!" : msg;
            li.appendChild(spanLevels);

            let button = document.createElement("input");
            button.setAttribute("type", "button");
            button.setAttribute("value", "Remove levels");
            button.addEventListener("click", (ev) => {
                node.querySelectorAll(":scope > newLevels > Point").forEach(point => { point.remove(); });
                spanLevels.textContent = "all clear!";
                li.removeChild(button);
            });

            if (msg != "") li.appendChild(button);

            ul.appendChild(li);
        });
    }

    // Add event listener to footer
    document.querySelectorAll("#dl-button > #dl").forEach(node => node.remove());
    let button = document.createElement("input");
    button.id = "dl";
    button.type = "button";
    button.value = filename;
    button.addEventListener("click", (ev) => {
        let serializer = new XMLSerializer();
        let blob = new Blob([serializer.serializeToString(xml)], {type: "application/xml"});

        let a = document.createElement("a");
        a.setAttribute("download", filename);
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
    });
    document.querySelector("#dl-button").appendChild(button);
}