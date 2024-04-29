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
const redBanContainersEl = document.getElementById("redBanContainers")
const blueBanContainersEl = document.getElementById("blueBanContainers")
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
            mapButton.setAttribute("id", allBeatmaps[i].beatmapID)
            mapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
            mapButton.addEventListener("click", mapClickEvent)
            mapButtonsSectionFragment.append(mapButton)
            setModColourForButton(mapButton, allBeatmaps[i].mod)
        }
        mapButtonsSectionEl.append(mapButtonsSectionFragment)
    })

// find map in mappool
const findMapInMappool = beatmapID => allBeatmaps.find(map => map.beatmapID === beatmapID)

// OBS SCENES
const sceneCollection = document.getElementById("sceneCollection")
let autoadvance_button = document.getElementById('autoAdvanceButton')
let autoadvance_timer_container = document.getElementById('autoAdvanceTimer')
let autoadvance_timer_label = document.getElementById('autoAdvanceTimerLabel')
autoadvance_timer_container.style.opacity = '0'

let enableAutoAdvance = false
const gameplay_scene_name = "Gameplay"
const mappool_scene_name = "Mappool"
const team_win_scene_name = "Team Win"

function switchAutoAdvance() {
    enableAutoAdvance = !enableAutoAdvance
    if (enableAutoAdvance) {
        autoadvance_button.innerHTML = 'AUTO ADVANCE: ON'
        autoadvance_button.style.backgroundColor = '#9ffcb3'
    } else {
        autoadvance_button.innerHTML = 'AUTO ADVANCE: OFF'
        autoadvance_button.style.backgroundColor = '#fc9f9f'
    }
}

const obsGetCurrentScene = window.obsstudio?.getCurrentScene ?? (() => {})
const obsGetScenes = window.obsstudio?.getScenes ?? (() => {})
const obsSetCurrentScene = window.obsstudio?.setCurrentScene ?? (() => {})

obsGetScenes(scenes => {
    for (const scene of scenes) {
        let clone = document.getElementById("sceneButtonTemplate").content.cloneNode(true)
        let buttonNode = clone.querySelector('div')
        buttonNode.id = `scene__${scene}`
        buttonNode.textContent = `GO TO: ${scene}`
        buttonNode.onclick = function() { obsSetCurrentScene(scene); }
        sceneCollection.appendChild(clone)
    }

    obsGetCurrentScene((scene) => { document.getElementById(`scene__${scene.name}`).classList.add("activeScene") })
})

window.addEventListener('obsSceneChanged', function(event) {
    let activeButton = document.getElementById(`scene__${event.detail.name}`)
    for (const scene of sceneCollection.children) { scene.classList.remove("activeScene") }
    activeButton.classList.add("activeScene")
})

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

// IPC State
let previousIPCState
let currentIPCState

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

                // Check for next action
                if (isAutopick && nextActionTextEl.innerText.includes("Pick")) document.getElementById(currentId).click()
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

    // IPC State
    if (currentIPCState !== data.tourney.manager.ipcState) {
        previousIPCState = currentIPCState
        currentIPCState = data.tourney.manager.ipcState 

        // Results
        if (enableAutoAdvance) {
            obsGetCurrentScene((scene) => {
                if (previousIPCState == 4 && currentIPCState == 1) {
                    if (currentRedStars !== currentFirstTo && currentBlueStars !== currentFirstTo) {
                        obsSetCurrentScene(mappool_scene_name)
                    } else {
                        obsSetCurrentScene(team_win_scene_name)
                    }
                } else if (currentIPCState == 2 || currentIPCState == 3) {
                    obsSetCurrentScene(gameplay_scene_name)
                }
            })
        }
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

// Change Next Action
const nextActionTextEl = document.getElementById("nextActionText")
const changeNextAction = (team, action) => nextActionTextEl.innerText = `${team} ${action}`

// Change autopick
const autopickToggleEl = document.getElementById("autopickToggle")
let isAutopick = false
function changeAutopick() {
    isAutopick = !isAutopick
    if (isAutopick) autopickToggleEl.innerText = "OFF"
    else autopickToggleEl.innerText = "ON"
}

// Map click event
function mapClickEvent() {

    // Perform validation checks
    const nextActionSplit = nextActionTextEl.innerText.split(" ")
    const nextActionColour = nextActionSplit[0]
    const nextActionAction = nextActionSplit[1]
    if (nextActionSplit.length !== 2) return
    if (nextActionColour !== "Blue" && nextActionColour !== "Red") return
    if (nextActionAction !== "Pick" && nextActionAction !== "Ban") return

    // Find map
    if (!allBeatmaps) return
    const currentIdInt = parseInt(this.id)
    const currentMap = findMapInMappool(currentIdInt)
    if (!currentMap) return

    // Check if the map is set elsewhere
    for (let i = 0; i < redBanContainersEl.childElementCount; i++) {
        if (redBanContainersEl.children[i].hasAttribute("id") && redBanContainersEl.children[i].id.includes(currentIdInt)) return
        if (blueBanContainersEl.children[i].hasAttribute("id") && blueBanContainersEl.children[i].id.includes(currentIdInt)) return
    }
    for (let i = 0; i < mapPicksContainerEl.childElementCount; i++) {
        if (mapPicksContainerEl.children[i].hasAttribute("id") && mapPicksContainerEl.children[i].id.includes(currentIdInt)) return
    }

    // Set Ban
    function setBan(container, currentId) {
        // Check tile number
        let tileNumber = 0
        if (container.children[0].hasAttribute("id")) tileNumber = 1

        // Remove gray from previous buttons
        const currentTile = container.children[tileNumber]
        if (currentTile.hasAttribute("id")) {
            let previousId = currentTile.id.split("-")[0]
            let previousButton = document.getElementById(`${previousId}`)
            previousButton.style.color = "black"
            setModColourForButton(previousButton, previousButton.innerText.substring(0, 2))
        }

        // Append data
        currentTile.setAttribute("id", `${currentId}-Ban`)
        currentTile.children[0].style.backgroundImage = `url("${currentMap.imgURL}")`
        currentTile.children[2].innerText = `${currentMap.mod}${currentMap.order}`
    }

    // Set Pick
    function setPick(currentId) {
        // Check tile number
        let tileNumber = 0
        let tileFound = false
        for (tileNumber; tileNumber < mapPicksContainerEl.childElementCount; tileNumber++) {
            if (mapPicksContainerEl.children[tileNumber].hasAttribute("id")) continue
            tileFound = true
            break
        }
        if (!tileFound) return

        // Append data
        const currentTile = mapPicksContainerEl.children[tileNumber]
        currentTile.setAttribute("id", `${currentId}-Pick`)
        currentTile.style.borderColor = `var(--main${nextActionColour})`
        currentTile.children[0].style.backgroundImage = `url("${currentMap.imgURL}")`
        currentTile.children[2].innerText = `${currentMap.mod}${currentMap.order}`

        // Set map picker colour
        mapPickerSectionEl.children[tileNumber].style.backgroundColor = `var(--main${nextActionColour})`
    }

    if (nextActionColour === "Red" && nextActionAction === "Ban") {
        setBan(redBanContainersEl, this.id)
    } else if (nextActionColour === "Blue" && nextActionAction === "Ban") {
        setBan(blueBanContainersEl, this.id)
    } else if ((nextActionColour === "Red" || nextActionColour === "Blue") && nextActionAction === "Pick") {
        setPick(this.id)

        setTimeout(() => {
            if (enableAutoAdvance) { obsGetCurrentScene((scene) => obsSetCurrentScene(gameplay_scene_name)) }
        }, 10000)
    }

    this.style.color = "gray"
    this.style.backgroundColor = "gray"

    // Set next action
    const banCount = banCounter()
    if (nextActionTextEl.innerText === "Red Ban" && (banCount === 1 || banCount === 3)) nextActionTextEl.innerText = "Blue Ban"
    else if (nextActionTextEl.innerText === "Blue Ban" && (banCount === 1 || banCount === 3)) nextActionTextEl.innerText = "Red Ban"
    else if (nextActionTextEl.innerText === "Red Pick") nextActionTextEl.innerText = "Blue Pick"
    else if (nextActionTextEl.innerText === "Blue Pick") nextActionTextEl.innerText = "Red Pick"
}

function banCounter() {
    let banCount = 0
    for (let i = 0; i < blueBanContainersEl.childElementCount; i++) {
        if (blueBanContainersEl.children[i].hasAttribute("id")) banCount++
        if (redBanContainersEl.children[i].hasAttribute("id")) banCount++
    }
    return banCount
}

function setModColourForButton(button, mod) {
    switch (mod) {
        case "NM":
            button.style.backgroundColor = "rgb(111,168,220)"
            break
        case "HD":
            button.style.backgroundColor = "rgb(255,217,102)"
            break
        case "HR":
            button.style.backgroundColor = "rgb(224,102,102)"
            break
        case "DT":
            button.style.backgroundColor = "rgb(142,124,195)"
            break
        case "EZ":
            button.style.backgroundColor = "rgb(147,196,125)"
            break
        case "FM":
            button.style.backgroundColor = "rgb(246,178,107)"
            break
        case "TB":
            button.style.backgroundColor = "rgb(194,123,160)"
            break
    }
}

// Pick Management
const pickBanManagementContainerEl = document.getElementById("pickBanManagementContainer")
const pickBanManagementSelectEl = document.getElementById("pickBanManagementSelect")
let currentPickManagementSelectAction
pickBanManagementSelectEl.onchange = function() {
    currentPickManagementSelectAction = pickBanManagementSelectEl.value

    // Set everything back to default
    currentTeamBanSelectPickTile = 0
    pickBanManagementMap = undefined
    while (pickBanManagementContainerEl.childElementCount > 2) pickBanManagementContainerEl.lastChild.remove()

    if (currentPickManagementSelectAction === "setBan" || currentPickManagementSelectAction === "removeBan") {
        const teamBanSelectHeader = createPickMangementHeader("Which team's ban?")

        // Create select
        const teamBanSelect = document.createElement("select")
        teamBanSelect.classList.add("pickBanManagementSelect")
        teamBanSelect.setAttribute("id", "teamBanSelect")
        teamBanSelect.setAttribute("size", 4)

        // Create all options
        teamBanSelect.append(createBanOption("red", 1))
        teamBanSelect.append(createBanOption("blue", 1))
        teamBanSelect.append(createBanOption("red", 2))
        teamBanSelect.append(createBanOption("blue", 2))
        pickBanManagementContainerEl.append(teamBanSelectHeader, teamBanSelect)

        if (currentPickManagementSelectAction === "setBan") {
            const teamBanSelectMapHeader = createPickMangementHeader("Which map?")

            // Create buttons for all maps
            const teamBanSelectMappoolMapSelect = document.createElement("div")
            teamBanSelectMappoolMapSelect.classList.add("teamPickBanSelectMappoolMapSelect")
            
            for (let i = 0; i < allBeatmaps.length; i++) {
                const teamBanSelectMappoolMap = document.createElement("button")
                teamBanSelectMappoolMap.classList.add("teamBanSelectMappoolMap")
                teamBanSelectMappoolMap.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                teamBanSelectMappoolMap.setAttribute("id", `${allBeatmaps[i].beatmapID}-pickBanManagement`)
                teamBanSelectMappoolMap.setAttribute("onclick", `getPickBanManagementMap(${allBeatmaps[i].beatmapID})`)
                teamBanSelectMappoolMapSelect.append(teamBanSelectMappoolMap)
            }
            pickBanManagementContainerEl.append(teamBanSelectMapHeader, teamBanSelectMappoolMapSelect)
        }
    }

    if (currentPickManagementSelectAction === "setPick" || currentPickManagementSelectAction === "removePick") {
        const teamPickSelectHeader = createPickMangementHeader("Which pick tile?")

        // Create buttons for all tiles
        const teamPickSelectPickTileMapSelect = document.createElement("div")
        teamPickSelectPickTileMapSelect.setAttribute("id", "teamPickSelectPickTileMapSelect")
        teamPickSelectPickTileMapSelect.classList.add("teamPickBanSelectMappoolMapSelect")

        for (let i = 0; i < mapPicksContainerEl.childElementCount; i++) {
            const teamPickSelectPickTileMap = document.createElement("button")
            const pickTileString = `pickTile${i}`
            teamPickSelectPickTileMap.classList.add("teamPickSelectPickTileMap")
            teamPickSelectPickTileMap.innerText = `PT ${i + 1}`
            teamPickSelectPickTileMap.setAttribute("id", pickTileString)
            teamPickSelectPickTileMap.setAttribute("onclick", `getPickBanManagementPickTile('${pickTileString}')`)
            teamPickSelectPickTileMapSelect.append(teamPickSelectPickTileMap)
        }

        pickBanManagementContainerEl.append(teamPickSelectHeader, teamPickSelectPickTileMapSelect)

        if (currentPickManagementSelectAction === "setPick") {
            const teamPickSelectMapHeader = createPickMangementHeader("Which map?")

            // Create buttons for all maps
            const teamPickSelectMappoolMapSelect = document.createElement("div")
            teamPickSelectMappoolMapSelect.classList.add("teamPickBanSelectMappoolMapSelect")
            
            for (let i = 0; i < allBeatmaps.length; i++) {
                const teamPickSelectMappoolMap = document.createElement("button")
                teamPickSelectMappoolMap.classList.add("teamBanSelectMappoolMap")
                teamPickSelectMappoolMap.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                teamPickSelectMappoolMap.setAttribute("id", `${allBeatmaps[i].beatmapID}-pickBanManagement`)
                teamPickSelectMappoolMap.setAttribute("onclick", `getPickBanManagementMap(${allBeatmaps[i].beatmapID})`)
                teamPickSelectMappoolMapSelect.append(teamPickSelectMappoolMap)
            }
            
            const teamPickHeader = createPickMangementHeader("Which team?")

            // Create select
            const teamPickSelect = document.createElement("select")
            teamPickSelect.classList.add("pickBanManagementSelect")
            teamPickSelect.setAttribute("id", "teamPickSelect")
            teamPickSelect.setAttribute("size", 2)

            // Create elements
            const redTeam = document.createElement("option")
            redTeam.setAttribute("value", `Red`)
            redTeam.innerText = "Red Team"
            const blueTeam = document.createElement("option")
            blueTeam.setAttribute("value", `Blue`)
            blueTeam.innerText = "Blue Team"

            teamPickSelect.append(redTeam, blueTeam)
            pickBanManagementContainerEl.append(teamPickSelectMapHeader, teamPickSelectMappoolMapSelect, teamPickHeader, teamPickSelect)
        }
    }

    // Apply changes button
    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("nextActionButton", "fullWidthButton")
    applyChangesButton.setAttribute("id", "applyChanges")
    applyChangesButton.style.width = "200px"
    applyChangesButton.innerText = "Apply Changes"

    switch (currentPickManagementSelectAction) {
        case "setBan": applyChangesButton.setAttribute("onclick", "pickManagementSetBan()"); break;
        case "removeBan": applyChangesButton.setAttribute("onclick", "pickManagementRemoveBan()"); break;
        case "setPick": applyChangesButton.setAttribute("onclick", "pickManagementSetPick()"); break;
        case "removePick": applyChangesButton.setAttribute("onclick", "pickManagementRemovePick()"); break;
    }

    pickBanManagementContainerEl.append(applyChangesButton)
}

// Create header
function createPickMangementHeader(message) {
    const teamBanSelectHeader = document.createElement("h1")
    teamBanSelectHeader.classList.add("sideBarSectionHeader")
    teamBanSelectHeader.innerText = message
    return teamBanSelectHeader
}

// Create ban option
function createBanOption(colour, index) {
    const teamBan = document.createElement("option")
    teamBan.setAttribute("value", `${colour}Ban${index}`)
    teamBan.innerText = `${colour.charAt(0).toUpperCase() + colour.slice(1)} Ban ${index}`
    return teamBan
}

// Get Map Option
const teamBanSelectMappoolMapEls = document.getElementsByClassName("teamBanSelectMappoolMap")
let pickBanManagementMap
function getPickBanManagementMap(beatmapID) {
    pickBanManagementMap = beatmapID
    for (let i = 0; i < teamBanSelectMappoolMapEls.length; i++) {
        teamBanSelectMappoolMapEls[i].style.color = "white"
        teamBanSelectMappoolMapEls[i].style.background = "transparent"
    }
    const currentPickManagementMap = document.getElementById(`${beatmapID}-pickBanManagement`)
    currentPickManagementMap.style.color = "black"
    currentPickManagementMap.style.backgroundColor = "rgb(206,206,206)"
}

// Pick Mangement Set Ban
function pickManagementSetBan() {
    // Do basic checks
    if (!pickBanManagementMap) return
    
    const teamBanSelectEl = document.getElementById("teamBanSelect")
    if (!teamBanSelectEl.value) return

    // Find the current map
    const currentMap = findMapInMappool(pickBanManagementMap)
    if (!currentMap) return

    // Find current tile
    const currentTile = getCurrentBanTile()
    if (!currentTile) return

    // Find if there is another map on the tile
    if (currentTile.hasAttribute("id")) pickBanManagementGetPreviousIdCount(currentTile)

    // Set tile
    currentTile.setAttribute("id", `${pickBanManagementMap}-Ban`)
    currentTile.children[0].style.backgroundImage = `url("${currentMap.imgURL}")`
    currentTile.children[2].innerText = `${currentMap.mod}${currentMap.order}`

    // Set colour of the map pick
    const currentMapPick = document.getElementById(`${pickBanManagementMap}`)
    currentMapPick.style.color = "gray"
    currentMapPick.style.backgroundColor = "gray"
}

// Pick Management Remove Ban
function pickManagementRemoveBan() {
    // 
    const teamBanSelectEl = document.getElementById("teamBanSelect")
    if (!teamBanSelectEl.value) return

    // Find current tile
    const currentTile = getCurrentBanTile()
    if (!currentTile) return

    // Find if there is another map on the tile
    if (currentTile.hasAttribute("id")) {
        pickBanManagementGetPreviousIdCount(currentTile)

        // Remove all information on the map tile
        currentTile.removeAttribute("id")
        currentTile.children[0].style.backgroundImage = "none"
        currentTile.children[2].innerText = ""
    }
}

// Get current ban tile
function getCurrentBanTile() {
    const teamBanSelectEl = document.getElementById("teamBanSelect")
    let currentTile
    if (teamBanSelectEl.value === "redBan1") currentTile = redBanContainersEl.children[0]
    else if (teamBanSelectEl.value === "redBan2") currentTile = redBanContainersEl.children[1]
    else if (teamBanSelectEl.value === "blueBan1") currentTile = blueBanContainersEl.children[0]
    else if (teamBanSelectEl.value === "blueBan2") currentTile = blueBanContainersEl.children[1]
    return currentTile
}

// Get previous id count
function pickBanManagementGetPreviousIdCount(tile) {
    let previousId = tile.id.split("-")[0]

    // Find if the same id is anywhere else (if the count is only 1, then it is only in that location)
    let previousIdCount = 0
    for (let i = 0; i < mapPicksContainerEl.childElementCount; i++) {
        if (!mapPicksContainerEl.children[i].hasAttribute("id") || !mapPicksContainerEl.children[i].id.includes(previousId)) continue
        previousIdCount++
    }
    for (let i = 0; i < redBanContainersEl.childElementCount; i++) {
        if (!redBanContainersEl.children[i].hasAttribute("id") || !redBanContainersEl.children[i].id.includes(previousId)) continue
        previousIdCount++
    }
    for (let i = 0; i < blueBanContainersEl.childElementCount; i++) {
        if (!blueBanContainersEl.children[i].hasAttribute("id") || !blueBanContainersEl.children[i].id.includes(previousId)) continue
        previousIdCount++
    }

    // Only if this was the only instance of the id, then we remove the colouring.
    if (previousIdCount === 1) {
        let previousButton = document.getElementById(`${previousId}`)
        previousButton.style.color = "black"
        setModColourForButton(previousButton, previousButton.innerText.substring(0, 2))
    }
}

//
const teamPickSelectPickTileMapEls = document.getElementsByClassName("teamPickSelectPickTileMap")
let currentTeamBanSelectPickTile
function getPickBanManagementPickTile(pickTileId) {
    currentTeamBanSelectPickTile = pickTileId.match(/\d+/g).map(Number)[0]
    for (let i = 0; i < teamPickSelectPickTileMapEls.length; i++) {
        teamPickSelectPickTileMapEls[i].style.color = "white"
        teamPickSelectPickTileMapEls[i].style.background = "transparent"
    }
    const currentPickManagementTileMap = document.getElementById(`${pickTileId}`)
    currentPickManagementTileMap.style.color = "black"
    currentPickManagementTileMap.style.backgroundColor = "rgb(206,206,206)"
}

// Set Pick
function pickManagementSetPick() {
    // General checks
    if (currentTeamBanSelectPickTile === undefined) return
    if (!pickBanManagementMap) return
    const teamPickSelectEl = document.getElementById("teamPickSelect")
    if (!teamPickSelectEl.value) return
    // Find map 
    const currentMap = findMapInMappool(pickBanManagementMap)
    if (!currentMap) return
    // Find tile
    const currentTile = mapPicksContainerEl.children[currentTeamBanSelectPickTile]
    if (!currentTile) return
    // Check for duplicate ids
    if (currentTile.hasAttribute("id")) {
        pickBanManagementGetPreviousIdCount(currentTile)
    }

    // Set map information
    currentTile.setAttribute("id", `${pickBanManagementMap}-Pick`)
    currentTile.style.borderColor = `var(--main${teamPickSelectEl.value})`
    currentTile.children[0].style.backgroundImage = `url("${currentMap.imgURL}")`
    currentTile.children[2].innerText = `${currentMap.mod}${currentMap.order}`
    mapPickerSectionEl.children[currentTeamBanSelectPickTile].style.backgroundColor = `var(--main${teamPickSelectEl.value})`

    // Set colour to gray'
    const currentPickButton = document.getElementById(`${pickBanManagementMap}`)
    currentPickButton.style.color = "gray"
    currentPickButton.style.backgroundColor = "gray"
}

// Remove Pick
function pickManagementRemovePick() {
    // General checks
    if (currentTeamBanSelectPickTile === undefined) return

    // Find tile
    const currentTile = mapPicksContainerEl.children[currentTeamBanSelectPickTile]
    if (!currentTile) return

    if (currentTile.hasAttribute("id")) {
        pickBanManagementGetPreviousIdCount(currentTile)
        currentTile.removeAttribute("id")
        currentTile.style.borderColor = "white"
        currentTile.children[0].style.backgroundImage = "none"
        currentTile.children[2].innerText = ""
        mapPickerSectionEl.children[currentTeamBanSelectPickTile].style.backgroundColor = `white`
    }
}