// Socket Events
// Credits: VictimCrasher - https://github.com/VictimCrasher/static/tree/master/WaveTournament
const socket = new ReconnectingWebSocket("ws://" + location.host + "/ws")
socket.onopen = () => { console.log("Successfully Connected") }
socket.onclose = event => { console.log("Socket Closed Connection: ", event); socket.send("Client Closed!") }
socket.onerror = error => { console.log("Socket Error: ", error) }

// Get Mappool
let allBeatmaps
fetch('http://127.0.0.1:24050/AUS/_data/beatmaps.json')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok')
        return response.json()
    })
    .then(data => { allBeatmaps = data.beatmaps })

// find map in mappool
const findMapInMappool = beatmapID => allBeatmaps.find(map => map.beatmapID === beatmapID)

// Team Name
const redTeamNameEl = document.getElementById("redTeamName")
const blueTeamNameEl = document.getElementById("blueTeamName")
let currentRedTeamName, currentBlueTeamName

// Team stars
const redTeamStarsEl = document.getElementById("redTeamStars")
const blueTeamStarsEl = document.getElementById("blueTeamStars")
let currentBestOf, currentRedStars, currentBlueStars

// Chat
const chatDisplay = document.getElementById("chatDisplay")
let chatLength = 0

socket.onmessage = async (event) => {
    const data = JSON.parse(event.data)

    // Team Names
    if (currentRedTeamName !== data.tourney.manager.teamName.left) {
        currentRedTeamName = data.tourney.manager.teamName.left
        redTeamNameEl.innerText = currentRedTeamName
    }
    if (currentBlueTeamName !== data.tourney.manager.teamName.right) {
        currentBlueTeamName = data.tourney.manager.teamName.right
        blueTeamNameEl.innerText = currentBlueTeamName
    }

    // Stars
    if (currentBestOf !== data.tourney.manager.bestOF ||
    currentRedStars !== data.tourney.manager.stars.left ||
    currentBlueStars !== data.tourney.manager.stars.right) {

        // Set details 
        currentBestOf = data.tourney.manager.bestOF
        let currentFirstTo = Math.ceil(currentBestOf / 2)
        currentRedStars = data.tourney.manager.stars.left
        currentBlueStars = data.tourney.manager.stars.right

        // Reset stars
        redTeamStarsEl.innerHTML = ""
        blueTeamStarsEl.innerHTML = ""

        // Red Stars
        function createStars(currentStars, index, teamStarFillColour) {
            let star = document.createElement("div")
            star.classList.add("teamStar")
            if (index < currentStars) star.classList.add(teamStarFillColour)
            return star
        }
        for (let i = 0; i < currentFirstTo; i++) {
            redTeamStarsEl.append(createStars(currentRedStars, i, "teamStarFillRed"))
            blueTeamStarsEl.append(createStars(currentBlueStars, i, "teamStarFillBlue"))
        }
    }

    if (chatLength !== data.tourney.manager.chat.length) {
        // Chat stuff
        // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
        (chatLength === 0 || chatLength > data.tourney.manager.chat.length) ? (chatDisplay.innerHTML = "", chatLength = 0) : null;
        const fragment = document.createDocumentFragment()

        for (let i = chatLength; i < data.tourney.manager.chat.length; i++) {
            const chatColour = data.tourney.manager.chat[i].team

            // Chat message container
            const chatMessageContainer = document.createElement("div")
            chatMessageContainer.classList.add("chatMessageContainer")

            // Time
            const chatMessageTime = document.createElement("div")
            chatMessageTime.classList.add("chatMessageTime")
            chatMessageTime.innerText = data.tourney.manager.chat[i].time

            // Whole Message
            const chatMessageContent = document.createElement("div")
            chatMessageContent.classList.add("chatMessageContent")  
            
            // Name
            const chatMessageName = document.createElement("div")
            chatMessageName.classList.add(chatColour)
            chatMessageName.innerText = data.tourney.manager.chat[i].name + ": "

            // Message
            const chatMessageText = document.createElement("div")
            chatMessageText.classList.add("chatMessageText")
            chatMessageText.innerText = data.tourney.manager.chat[i].messageBody

            chatMessageContent.append(chatMessageName, chatMessageText)
            chatMessageContainer.append(chatMessageTime, chatMessageContent)
            fragment.append(chatMessageContainer)
        }

        chatDisplay.append(fragment)
        chatLength = data.tourney.manager.chat.length
        chatDisplay.scrollTo({
            top: chatDisplay.scrollHeight,
            behavior: 'smooth'
        })
    }
}