// Socket Events
// Credits: VictimCrasher - https://github.com/VictimCrasher/static/tree/master/WaveTournament
const socket = new ReconnectingWebSocket("ws://" + location.host + "/ws")
socket.onopen = () => { console.log("Successfully Connected") }
socket.onclose = event => { console.log("Socket Closed Connection: ", event); socket.send("Client Closed!") }
socket.onerror = error => { console.log("Socket Error: ", error) }

// Get Mappool
const mapPicksContainerEl = document.getElementById("mapPicksContainer")
const mapPickerSectionEl = document.getElementById("mapPickerSection")
const mapButtonsSectionEl = document.getElementById("mapButtonsSection")
let allBeatmaps
fetch('http://127.0.0.1:24050/AUS/_data/beatmaps.json')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok')
        return response.json()
    })
    .then(data => { 
        let currentBestOf
        allBeatmaps = data.beatmaps 

        // Set current best of
        switch (data.roundName.toLowerCase()) {
            case "quarterfinals": case "semifinals":
                currentBestOf = 11
                break
            case "finals": case "grand finals":
                currentBestOf = 13
        }

        let mapPickContainersFragment = document.createDocumentFragment()
        let mapPickerSectionFragment = document.createDocumentFragment()
        for (let i = 0; i < currentBestOf; i++) {
            // Create map pick tile
            const mapPickContainer = document.createElement("div")
            mapPickContainer.classList.add("mapPickContainer")

            const mapPickBackground = document.createElement("div")
            mapPickBackground.classList.add("mapPickBackground")

            const mapPickLayer = document.createElement("div")
            mapPickLayer.classList.add("mapPickLayer")

            const mapPickText = document.createElement("div")
            mapPickText.classList.add("mapPickText")

            mapPickContainer.append(mapPickBackground, mapPickLayer, mapPickText)
            mapPickContainersFragment.append(mapPickContainer)

            // Create map picker tile
            const mapPicker = document.createElement("div")
            mapPicker.classList.add("mapPicker")
            mapPickerSectionFragment.append(mapPicker)
        }
        mapPicksContainerEl.append(mapPickContainersFragment)
        mapPickerSectionEl.append(mapPickerSectionFragment)

        // Create map buttons
        let mapButtonsSectionFragment = document.createDocumentFragment()
        for (let i = 0; i < allBeatmaps.length; i++) {
            const mapButton = document.createElement("button")
            mapButton.classList.add("mapButton")
            mapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
            mapButtonsSectionFragment.append(mapButton)

            switch (allBeatmaps[i].mod) {
                case "NM":
                    mapButton.style.backgroundColor = "rgb(111,168,220)"
                    break
                case "HD":
                    mapButton.style.backgroundColor = "rgb(255,217,102)"
                    break
                case "HR":
                    mapButton.style.backgroundColor = "rgb(224,102,102)"
                    break
                case "DT":
                    mapButton.style.backgroundColor = "rgb(142,124,195)"
                    break
                case "EZ":
                    mapButton.style.backgroundColor = "rgb(147,196,125)"
                    break
                case "FM":
                    mapButton.style.backgroundColor = "rgb(246,178,107)"
                    break
                case "TB":
                    mapButton.style.backgroundColor = "rgb(194,123,160)"
                    break
            }
        }
        mapButtonsSectionEl.append(mapButtonsSectionFragment)
    })

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

// Now Playing
const nowPlayingBackgroundEl = document.getElementById("nowPlayingBackground")
const nowPlayingTitleSongEl = document.getElementById("nowPlayingTitleSong")
const nowPlayingDifficultyEl = document.getElementById("nowPlayingDifficulty")
const nowPlayingStatsSRNumberEl = document.getElementById("nowPlayingStatsSRNumber")
const nowPlayingStatsARNumberEl = document.getElementById("nowPlayingStatsARNumber")
const nowPlayingStatsCSNumberEl = document.getElementById("nowPlayingStatsCSNumber")
const nowPlayingStatsBPMNumberEl = document.getElementById("nowPlayingStatsBPMNumber")
const nowPlayingStatsLENNumberEl = document.getElementById("nowPlayingStatsLENNumber")
let currentId, currentMd5
let mappoolMapFound = false

// Chat
const chatDisplayEl = document.getElementById("chatDisplay")
let chatLength = 0

socket.onmessage = async (event) => {
    const data = JSON.parse(event.data)
    console.log(data)

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

    if ((currentId !== data.menu.bm.id || currentMd5 !== data.menu.bm.md5) && data.menu.bm.id !== 0) {
        mappoolMapFound = false
        currentId = data.menu.bm.id 
        currentMd5 = data.menu.bm.md5

        nowPlayingBackgroundEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.menu.bm.set}/covers/cover.jpg")`
        nowPlayingTitleSongEl.innerText = `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`
        nowPlayingDifficultyEl.innerText = `[${data.menu.bm.metadata.difficulty}]`

        setWrapForTexts(nowPlayingTitleSongEl, 552.4)
        setWrapForTexts(nowPlayingDifficultyEl, 548)

        if (allBeatmaps) {
            const currentMap = findMapInMappool(currentId)
            if (currentMap) {
                mappoolMapFound = true
                nowPlayingStatsSRNumberEl.innerText = Math.round(parseFloat(currentMap.difficultyrating) * 100) / 100
                nowPlayingStatsARNumberEl.innerText = Math.round(parseFloat(currentMap.ar) * 10) / 10
                nowPlayingStatsCSNumberEl.innerText = Math.round(parseFloat(currentMap.cs) * 10) / 10
                nowPlayingStatsBPMNumberEl.innerText = Math.round(parseFloat(currentMap.bpm))
                displayLength(currentMap.songLength)
            }
        }
    }

    // Found map in mappool?
    if (!mappoolMapFound) {
        nowPlayingStatsSRNumberEl.innerText = data.menu.bm.stats.fullSR
        nowPlayingStatsARNumberEl.innerText = data.menu.bm.stats.AR
        nowPlayingStatsCSNumberEl.innerText = data.menu.bm.stats.CS
        nowPlayingStatsBPMNumberEl.innerText = data.menu.bm.stats.BPM.common
        displayLength(Math.round(data.menu.bm.time.full / 1000))
    }

    if (chatLength !== data.tourney.manager.chat.length) {
        // Chat stuff
        // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
        (chatLength === 0 || chatLength > data.tourney.manager.chat.length) ? (chatDisplayEl.innerHTML = "", chatLength = 0) : null;
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

        chatDisplayEl.append(fragment)
        chatLength = data.tourney.manager.chat.length
        chatDisplayEl.scrollTo({
            top: chatDisplayEl.scrollHeight,
            behavior: 'smooth'
        })
    }
}

// Set text wrap class for title / song name and difficulty
function setWrapForTexts(element, width) {
    if (element.getBoundingClientRect().width > width) element.classList.add("nowPlayingTextWrap")
    else element.classList.remove("nowPlayingTextWrap")
}

// Display length
function displayLength(songLength) {
    const minutes = Math.floor(songLength / 60)
    const seconds = Math.floor(songLength % 60).toString().padStart(2, '0')
    nowPlayingStatsLENNumberEl.innerText = `${minutes}:${seconds}`
}