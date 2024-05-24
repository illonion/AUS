let allTeams
fetch('http://127.0.0.1:24050/AUS/_data/teams.json')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok')
        return response.json()
    })
    .then(data => allTeams = data)

// Get Cookie
function getCookie(cname) {
    let name = cname + "="
    let ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length)
    }
    return ""
}

const playerDetailsEl = document.getElementById("playerDetails")
let previousTeamName
let currentTeamName
let teamSize = 2

// Main body
const mainEl = document.getElementById("main")

setInterval(() => {
    // If no winner
    if (getCookie("winnerTeamName") == "noOne") {
        playerDetailsEl.innerHTML = ""
        return
    }

    if (allTeams) {
        previousTeamName = currentTeamName
        currentTeamName = getCookie("winnerTeamName")
    
        if (currentTeamName !== previousTeamName) {
            for (let i = 0; i < allTeams.length; i++) {
                if (currentTeamName === allTeams[i].teamName) {
                    playerDetailsEl.innerHTML = ""
                    if (allTeams[i].playerId4 !== "") teamSize = 4
                    else if (allTeams[i].playerId3 !== "") teamSize = 3
                    else teamSize = 2

                    playerDetailsEl.append(createPlayerElement(allTeams[i].playerId1, allTeams[i].playerName1, allTeams[i].playerRank1))
                    playerDetailsEl.append(createPlayerElement(allTeams[i].playerId2, allTeams[i].playerName2, allTeams[i].playerRank2))
                    if (teamSize >= 3) playerDetailsEl.append(createPlayerElement(allTeams[i].playerId3, allTeams[i].playerName3, allTeams[i].playerRank3))
                    if (teamSize = 4) playerDetailsEl.append(createPlayerElement(allTeams[i].playerId4, allTeams[i].playerName4, allTeams[i].playerRank4))
                }
            }
        }

        // Set championship winning background
        const championshipContender = getCookie("championshipContender")
        if (championshipContender === currentTeamName || championshipContender === "BOTH") mainEl.style.backgroundImage = `url("static/background_champ.png")`
        else mainEl.style.backgroundImage = `url("static/background.png")`
    }
}, 500)

function createPlayerElement(playerId, playerName, playerRank) {
    const playerDetailsEl = document.createElement("div")
    playerDetailsEl.classList.add("playerDetails")

    const playerProfilePictureEl = document.createElement("img")
    playerProfilePictureEl.classList.add("playerProfilePicture")
    playerProfilePictureEl.setAttribute("src", `https://a.ppy.sh/${playerId}`)

    const playerNameEl = document.createElement("div")
    playerNameEl.classList.add("playerName")
    playerNameEl.innerText = playerName

    const playerRankEl = document.createElement("div")
    playerRankEl.classList.add("playerRank")
    playerRankEl.innerText = playerRank

    playerDetailsEl.append(playerProfilePictureEl, playerNameEl, playerRankEl)
    return playerDetailsEl
}