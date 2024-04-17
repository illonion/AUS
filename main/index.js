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

// Score Visibility
const gameplayImageEl = document.getElementById("gameplayImage")
let isScoreVisible

// Moving score bar
const redTeamMovingScoreBarEl = document.getElementById("redTeamMovingScoreBar")
const blueTeamMovingScoreBarEl = document.getElementById("blueTeamMovingScoreBar")

// Scores
const redScoreEl = document.getElementById("redScore")
const blueScoreEl = document.getElementById("blueScore")
const scoreDifferenceEl = document.getElementById("scoreDifference")

// Score difference
const scoreDifferenceLeftEl = document.getElementById("scoreDifferenceLeft")
const scoreDifferenceNumberEl = document.getElementById("scoreDifferenceNumber")
const scoreDifferenceRightEl = document.getElementById("scoreDifferenceRight")
let currentScoreRed, currentScoreBlue, currentScoreDifference

// Score animation
let scoreAnimation = {
    redScore: new CountUp(redScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    blueScore: new CountUp(blueScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    scoreDifferenceNumber: new CountUp(scoreDifferenceNumberEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." })
}

// Chat
const chatDisplay = document.getElementById("chatDisplay")
let chatLength = 0

// Now Playing
const nowPlayingEl = document.getElementById("nowPlaying")
const nowPlayingArtistEl = document.getElementById("nowPlayingArtist")
const nowPlayingSongNameEl = document.getElementById("nowPlayingSongName")
const nowPlayingDifficultyEl = document.getElementById("nowPlayingDifficulty")
const nowPlayingSRNumberEl = document.getElementById("nowPlayingSRNumber")
const nowPlayingARNumberEl = document.getElementById("nowPlayingARNumber")
const nowPlayingCSNumberEl = document.getElementById("nowPlayingCSNumber")
const nowPlayingLENNumberEl = document.getElementById("nowPlayingLENNumber")
let nowPlayingId, nowPlayingMd5
let foundMapInMappool = false

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

    // Score visibility
    if (isScoreVisible !== data.tourney.manager.bools.scoreVisible) {
        isScoreVisible = data.tourney.manager.bools.scoreVisible

        if (isScoreVisible) {
            gameplayImageEl.style.opacity = 1
            redTeamMovingScoreBarEl.style.opacity = 1
            blueTeamMovingScoreBarEl.style.opacity = 1
            redScoreEl.style.opacity = 1
            blueScoreEl.style.opacity = 1
            scoreDifferenceEl.style.opacity = 1
            chatDisplay.style.opacity = 0
        } else {
            gameplayImageEl.style.opacity = 0
            redTeamMovingScoreBarEl.style.opacity = 0
            blueTeamMovingScoreBarEl.style.opacity = 0
            redScoreEl.style.opacity = 0
            blueScoreEl.style.opacity = 0
            scoreDifferenceEl.style.opacity = 0
            chatDisplay.style.opacity = 1
        }
    }

    // Scores
    if (isScoreVisible) {
        // Setting scores
        currentScoreRed = data.tourney.manager.gameplay.score.left
        currentScoreBlue = data.tourney.manager.gameplay.score.right
        currentScoreDifference = Math.abs(currentScoreRed - currentScoreBlue)

        // Score animation
        scoreAnimation.redScore.update(currentScoreRed)
        scoreAnimation.blueScore.update(currentScoreBlue)
        scoreAnimation.scoreDifferenceNumber.update(currentScoreDifference)

        // Moving score bar width
        const movingScoreBarDifferencePercent = Math.min(currentScoreDifference / 650000, 1)
        let movingScoreBarRectangleWidth = Math.min(Math.pow(movingScoreBarDifferencePercent, 0.5) * 0.8 * 610, 610)

        // Conditionals
        if (currentScoreRed > currentScoreBlue) {
            redTeamMovingScoreBarEl.style.width = `${movingScoreBarRectangleWidth}px`
            blueTeamMovingScoreBarEl.style.width = 0
            scoreDifferenceLeftEl.style.display = "inline"
            scoreDifferenceRightEl.style.display = "none"
        } else if (currentScoreRed === currentScoreBlue) {
            redTeamMovingScoreBarEl.style.width = 0
            blueTeamMovingScoreBarEl.style.width = 0
            scoreDifferenceLeftEl.style.display = "none"
            scoreDifferenceRightEl.style.display = "none"
        } else if (currentScoreRed < currentScoreBlue) {
            redTeamMovingScoreBarEl.style.width = 0
            blueTeamMovingScoreBarEl.style.width = `${movingScoreBarRectangleWidth}px`
            scoreDifferenceLeftEl.style.display = "none"
            scoreDifferenceRightEl.style.display = "inline"
        }
    } else if (chatLength !== data.tourney.manager.chat.length) {
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
    
    // Beatmaps
    if (nowPlayingId !== data.menu.bm.id || nowPlayingMd5 !== data.menu.bm.md5) {
        foundMapInMappool = false
        nowPlayingId = data.menu.bm.id
        nowPlayingMd5 = data.menu.bm.md5

        // Metadata
        nowPlayingEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.menu.bm.set}/covers/cover.jpg")`
        nowPlayingArtistEl.innerText = data.menu.bm.metadata.artist
        nowPlayingSongNameEl.innerText = data.menu.bm.metadata.title
        nowPlayingDifficultyEl.innerText = data.menu.bm.metadata.difficulty
    
        // If mappool maps exist
        if (allBeatmaps) {
            // Found map in mappool
            const currentMap = findMapInMappool(nowPlayingId)
            if (!currentMap) return
            foundMapInMappool = true

            // Display mappool details
            nowPlayingSRNumberEl.innerText = Math.round(parseFloat(currentMap.difficultyrating) * 100) / 100
            nowPlayingARNumberEl.innerText = Math.round(parseFloat(currentMap.ar) * 10) / 10
            nowPlayingCSNumberEl.innerText = Math.round(parseFloat(currentMap.cs) * 10) / 10
            displayLength(currentMap.songLength)
        }
    }

    // Found map in mappool?
    if (!foundMapInMappool) {
        nowPlayingSRNumberEl.innerText = data.menu.bm.stats.fullSR
        nowPlayingARNumberEl.innerText = data.menu.bm.stats.AR
        nowPlayingCSNumberEl.innerText = data.menu.bm.stats.CS
        displayLength(Math.round(data.menu.bm.time.full / 1000))
    }
}

function displayLength(songLength) {
    const minutes = Math.floor(songLength / 60)
    const seconds = Math.floor(songLength % 60).toString().padStart(2, '0')
    nowPlayingLENNumberEl.innerText = `${minutes}:${seconds}`
}