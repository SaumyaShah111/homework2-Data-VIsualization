let data = {
    vowels: {
        frequencies: { 'a': 0, 'e': 0, 'i': 0, 'o': 0, 'u': 0, 'y': 0 }
    },
    consonants: {
        frequencies: { 'b': 0, 'c': 0, 'd': 0, 'f': 0, 'g': 0, 'h': 0, 'j': 0, 'k': 0, 'l': 0, 'm': 0, 'n': 0, 'p': 0, 'q': 0, 'r': 0, 's': 0, 't': 0, 'v': 0, 'w': 0, 'x': 0, 'z': 0 }
    },
    punctuations: {
        frequencies: { '.': 0, ',': 0, '?': 0, '!': 0, ':': 0, ';': 0 }
    }
};


const highlightColor = '#ff4500';  
const highlightStrokeWidth = 3;    

function categorizeAndCountCharacters(text) {
    text = text.toLowerCase();
    let vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    let punctuations = ['.', ',', '?', '!', ':', ';'];
    let consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z'];

    // Resetting counts for new input
    data.vowels.count = 0;
    data.consonants.count = 0;
    data.punctuations.count = 0;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (vowels.includes(char)) {
            data.vowels.frequencies[char]++;
        } else if (punctuations.includes(char)) {
            data.punctuations.frequencies[char]++;
        } else if (consonants.includes(char)) {
            data.consonants.frequencies[char]++;
        }
    }
}

function countAndCategorizeCharacters(text) {
    // Process the text and populate the data object
    categorizeAndCountCharacters(text);

    // Create the character occurrence object for treemap
    const characterOccurrences = {
        children: [
            {
                name: 'Vowels',
                children: Object.keys(data.vowels.frequencies)
                    .filter(char => data.vowels.frequencies[char] > 0) // Filter out 0 occurrences
                    .map(char => ({
                        name: char,
                        value: data.vowels.frequencies[char]
                    }))
            },
            {
                name: 'Consonants',
                children: Object.keys(data.consonants.frequencies)
                    .filter(char => data.consonants.frequencies[char] > 0) // Filter out 0 occurrences
                    .map(char => ({
                        name: char,
                        value: data.consonants.frequencies[char]
                    }))
            },
            {
                name: 'Punctuation',
                children: Object.keys(data.punctuations.frequencies)
                    .filter(char => data.punctuations.frequencies[char] > 0) // Filter out 0 occurrences
                    .map(char => ({
                        name: char,
                        value: data.punctuations.frequencies[char]
                    }))
            }
        ]
    };

    return characterOccurrences;
}

function createTreemap(data, text) {
    const svg = d3.select("#treemap_svg");
    const width = 575; 
    const height = 400; 

    svg.selectAll("*").remove(); 

    const root = d3.hierarchy(data)
        .sum(d => d.value);

    const treemapLayout = d3.treemap()
        .size([width, height])
        .padding(1);

    treemapLayout(root);

    const colorScale = {
        Vowels: '#00ff00',
        Consonants: '#ffff00',
        Punctuation: '#800080'
    };

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgrey")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("padding", "8px")
        .style("opacity", 0)
        .style("pointer-events", "none");

    const rects = svg.selectAll('rect')
        .data(root.leaves())
        .enter()
        .append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .style('stroke', 'black')
        .style('stroke-width', 1)
        .style('fill', d => colorScale[d.parent.data.name]) 
        .on('mouseenter', function (event, d) {
            highlightCharacter(d.data.name);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Character: ${d.data.name}<br>Count: ${d.data.value}`)
                .style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY - 20) + "px");
        })
        .on('mouseleave', function (event, d) {
            unhighlightCharacter(d.data.name);
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            drawSankey(d.data.name, text);
        });
}

function getNodeColor(char) {
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    const punctuations = ['.', ',', '?', '!', ':', ';'];

    if (vowels.includes(char)) {
        return "green";  
    } else if (punctuations.includes(char)) {
        return "purple";  
    } else {
        return "yellow";  
    }
}

function drawSankey(character, text) {
    const leftOccurrences = {};
    const rightOccurrences = {};
    let charCount = 0;

    // Count occurrences of characters surrounding the specified character
    for (let i = 0; i < text.length; i++) {
        const currentChar = text[i].toLowerCase();
        if (currentChar === character.toLowerCase()) {
            charCount++;
            if (i > 0) {
                const leftChar = text[i - 1].toLowerCase();
                if (leftChar.trim() && leftChar !== character.toLowerCase()) {
                    leftOccurrences[leftChar] = (leftOccurrences[leftChar] || 0) + 1;
                }
            }
            if (i < text.length - 1) {
                const rightChar = text[i + 1].toLowerCase();
                if (rightChar.trim() && rightChar !== character.toLowerCase()) {
                    rightOccurrences[rightChar] = (rightOccurrences[rightChar] || 0) + 1;
                }
            }
        }
    }

    const nodes = [{ name: character }]; // Starting node for the character
    const links = [];

    // Add left occurrences as nodes and links
    Object.entries(leftOccurrences).forEach(([key, value], index) => {
        nodes.push({ name: `${key} (left)` });
        links.push({ source: index + 1, target: 0, value: value });
    });

    // Add right occurrences as nodes and links
    Object.entries(rightOccurrences).forEach(([key, value], index) => {
        nodes.push({ name: `${key} (right)` });
        links.push({ source: 0, target: index + 1 + Object.keys(leftOccurrences).length, value: value });
    });

    // Prepare the graph object for Sankey
    const graph = { nodes, links };

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [400, 300]]);

    const svg = d3.select("#sankey_svg");
    svg.selectAll("*").remove(); // Clear previous content

    const tooltip = d3.select(".tooltip");

    try {
        const { nodes: sankeyNodes, links: sankeyLinks } = sankey(graph);

        // Add links
        svg.append("g")
            .selectAll("path")
            .data(sankeyLinks)
            .enter()
            .append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .style("fill", "none")
            .style("stroke", "#d0d0d0")
            .style("opacity", 0.5)
            .on('mouseenter', function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`${d.source.name} flows into ${d.target.name.split(' ')[0]} ${d.value} times`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on('mousemove', function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on('mouseleave', function () {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add nodes
        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(sankeyNodes)
            .enter()
            .append("g");

        nodeGroup.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", sankey.nodeWidth())
            .style("fill", d => getNodeColor(d.name.split(' ')[0]))
            .style("stroke", "#000")
            .style("stroke-width", 1)
            .on('mouseenter', function(event, d) {
                highlightCharacter(d.name.split(' ')[0]);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Character '${d.name.split(' ')[0]}' appears ${charCount} times.`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on('mouseleave', function(event, d) {
                unhighlightCharacter(d.name.split(' ')[0]);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add labels to nodes
        nodeGroup.append("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name)
            .filter(d => d.x0 < 200) // Adjust based on your layout
            .attr("x", d => d.x1 + 6)
            .attr("text-anchor", "start");

    } catch (error) {
        console.error("Error while drawing Sankey:", error);
        svg.append("text")
            .attr("x", 200)
            .attr("y", 200)
            .attr("text-anchor", "middle")
            .text("Error: Unable to create Sankey diagram");
    }
}

function highlightCharacter(character) {
    // Highlight in treemap
    d3.select("#treemap_svg")
        .selectAll('rect')
        .filter(d => d.data.name.toLowerCase() === character.toLowerCase())
        .style('stroke', highlightColor)
        .style('stroke-width', highlightStrokeWidth);

    // Highlight in Sankey
    d3.select("#sankey_svg")
        .selectAll('rect')
        .filter(d => d.name.split(' ')[0].toLowerCase() === character.toLowerCase())
        .style('stroke', highlightColor)
        .style('stroke-width', highlightStrokeWidth);
}

function unhighlightCharacter(character) {
    // Unhighlight in treemap
    d3.select("#treemap_svg")
        .selectAll('rect')
        .filter(d => d.data.name.toLowerCase() === character.toLowerCase())
        .style('stroke', 'black')
        .style('stroke-width', 1);

    // Unhighlight in Sankey
    d3.select("#sankey_svg")
        .selectAll('rect')
        .filter(d => d.name.split(' ')[0].toLowerCase() === character.toLowerCase())
        .style('stroke', '#000')
        .style('stroke-width', 1);
}

document.getElementById('submitBtn').addEventListener('click', function() {
    const text = document.getElementById('wordbox').value.trim();
    const categorizedData = countAndCategorizeCharacters(text);
    createTreemap(categorizedData, text);
});