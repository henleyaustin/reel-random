let currentMovieIndex = 0;
let movies = [];
let angle = 0;
let defaultSpeed = 2;
let rotationSpeed = defaultSpeed;
let interval;
let targetAngle;
let currentlySpinning = false;

const spinnerElement = document.querySelector('.spinner');
const diskTextRight = document.querySelector('.disk-text-right');
const diskTextLeft = document.querySelector('.disk-text-left');

const rightSide = document.getElementById('right-side');
const introTemplate = document.getElementById('intro-panel').content;
const movieSelectedTemplate = document.getElementById('movie-selected-panel').content;
const loadingTemplate = document.getElementById('loader').content;

document.addEventListener('DOMContentLoaded', () => {
    loadIntroPanel();
});

// Function to load intro panel
function loadIntroPanel() {
    rightSide.innerHTML = '';
    rightSide.appendChild(introTemplate.cloneNode(true));
    addIntroPanelListeners();
}

// Function to load movie selected panel
function loadMovieSelectedPanel() {
    // Add animation to the buttons
    const introPanel = document.querySelector(".intro-panel");
    if (introPanel) {
        introPanel.classList.add("slide-down-dissapear"); // Remove the intro buttons
    }
    rightSide.innerHTML = '';
    rightSide.appendChild(movieSelectedTemplate.cloneNode(true));
    const movieSelectedPanel = document.querySelector(".movie-selected-panel");
    movieSelectedPanel.classList.add("slide-down-appear"); // Add the "movie selected" items
    addMovieSelectedPanelListeners();
}

function loading() {
    rightSide.innerHTML = '';
    rightSide.appendChild(loadingTemplate.cloneNode(true));
}

function addIntroPanelListeners() {
    const chooseBtn = document.getElementById('choose-button');
    const realFileBtn = document.getElementById('real-file');
    const chooseTxt = document.getElementById('choose-text');
    const pickBtn = document.getElementById('pick-button');

    chooseBtn.addEventListener("click", function () {
        realFileBtn.click();
    });

    realFileBtn.addEventListener('change', function (event) {
        const input = event.target;
        if ('files' in input && input.files.length > 0) {
            readFileContent(input.files[0]).then(content => {
                movies = extractMovies(content);
                shuffleArray(movies);

                if (movies.length > 1) {
                    diskTextRight.textContent = movies[0].title;
                    diskTextLeft.textContent = movies[1].title;
                    currentMovieIndex = 1; // Set to 1 assuming the left text is set to the second title and will update first
                }

                if (realFileBtn.value) {
                    chooseTxt.innerHTML = realFileBtn.value.match(
                        /[\/\\]([\w\d\s\.\-\(\)]+)$/
                    )[1];
                } else {
                    chooseTxt.innerHTML = "No file chosen, yet.";
                }

                startDiscAnimation();

            }).catch(error => console.log(error));
        }
    });

    pickBtn.addEventListener("click", function () {
        clearInterval(interval); // Clear any existing interval to avoid multiple intervals running simultaneously
        if (currentlySpinning) {
            speedUpRotation();
            loading();
        } else {
            console.log("Disc is not currently spinning");
        }
    });
}

function addMovieSelectedPanelListeners() {
    const respinBtn = document.getElementById('respin-button');

    respinBtn.addEventListener("click", function () {
        clearInterval(interval);
        if (!currentlySpinning) {
            rotationSpeed = defaultSpeed;
            requestAnimationFrame(rotateDisc);
            speedUpRotation();
            loading();
        } else {
            console.log("Disc is currently spinning");
        }
    });
}

function speedUpRotation() {
    rotationSpeed = 20; // Set a high speed initially
    currentlySpinning = true;
    setTimeout(slowDownRotationSpeed, 3000); // Start slowing down after 3 seconds
}

function slowDownRotationSpeed() {
    interval = setInterval(function () {
        rotationSpeed *= 0.95; // Reduce the speed by 5% each interval

        if (rotationSpeed <= 2) { // Check if the speed is very close to 0
            clearInterval(interval);
            determineTargetAngle();
            approachDefinedRotation();
        }
    }, 16); // Adjust the interval timing (16ms for smoother animation)
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function extractMovies(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const titleIndex = headers.indexOf('Title');
    const urlIndex = headers.indexOf('URL');
    const titlesAndUrls = lines.splice(1).map((line) => {
        const columns = line.split(',');
        return {
            title: columns[titleIndex],
            url: columns[urlIndex]
        }
    })
    return titlesAndUrls;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startDiscAnimation() {
    const discCont = document.querySelector(".disk-container");
    discCont.classList.add("slide-in");
    currentlySpinning = true;
    requestAnimationFrame(rotateDisc);
}

function rotateDisc() {
    angle = (angle + rotationSpeed) % 360;
    spinnerElement.style.transform = `rotate(${angle}deg)`;

    if (angle >= 180 && angle < 180 + rotationSpeed) {
        currentMovieIndex = (currentMovieIndex + 1) % movies.length;
        diskTextRight.textContent = movies[currentMovieIndex].title;
    }

    if ((angle >= 360 && angle < 360 + rotationSpeed) || angle < rotationSpeed) {
        currentMovieIndex = (currentMovieIndex + 1) % movies.length;
        diskTextLeft.textContent = movies[currentMovieIndex].title;
    }

    if (rotationSpeed > 0) {
        requestAnimationFrame(rotateDisc);
    }
}

function determineTargetAngle() {
    const modAngle = angle % 360;
    const distanceTo180 = Math.abs(180 - modAngle);
    const distanceTo360 = Math.abs(360 - modAngle);

    if (distanceTo180 < distanceTo360) {
        targetAngle = 180;
    } else {
        targetAngle = 360;
    }

    // Ensure that targetAngle is ahead of the current angle
    if (targetAngle < modAngle) {
        targetAngle += 180;
    }
}

function approachDefinedRotation() {
    interval = setInterval(function () {
        if (angle < targetAngle) {
            angle = (angle + rotationSpeed) % 360;
            if (angle >= (targetAngle - 2)) {
                angle = targetAngle % 360;
                spinnerElement.style.transform = `rotate(${angle}deg)`;
                clearInterval(interval);

                // Stop the disc
                rotationSpeed = 0;
                loadMovieSelectedPanel();



                const selectedTitleHTML = document.getElementById("selected-title");

                // Display selected title to screen
                selectedTitleHTML.innerHTML = `<a href="${movies[currentMovieIndex].url}" target="_blank">${movies[currentMovieIndex].title}</a>`;


                // Set this to false so we can restart the disc
                currentlySpinning = false;
            } else {
                angle = (angle + 360) % 360; // Normalize the angle
                spinnerElement.style.transform = `rotate(${angle}deg)`;
            }
        } else {
            clearInterval(interval);
            rotationSpeed = 0;
            selectedTitleHTML.innerHTML = movies[currentMovieIndex].title;
        }
    }, 16); // Use 16ms for smoother animation (approximately 60fps)
}
