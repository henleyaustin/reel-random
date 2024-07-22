const defaultSpeed = 2;

var currentMovieIndex = 0;
var movies = [];
var angle = 0;
var rotationSpeed = defaultSpeed;
var interval;
var targetAngle;
var currentlySpinning = false;

// #region Global document references
const spinnerElement = document.querySelector('.spinner');
const diskTextRight = document.querySelector('.disk-text-right');
const diskTextLeft = document.querySelector('.disk-text-left');

const rightSide = document.getElementById('right-side');
const introTemplate = document.getElementById('intro-panel').content;
const movieSelectedTemplate = document.getElementById('movie-selected-panel').content;
const loadingTemplate = document.getElementById('loader').content;
// #endregion

// Initalize with the intro panel
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
const loadMovieSelectedPanel = () => {
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
};

// Adds loading template to the right side of the screen
const loading = () => {
    rightSide.innerHTML = '';
    rightSide.appendChild(loadingTemplate.cloneNode(true));
};


const addIntroPanelListeners = () => {
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
            readFileContent(input.files[0]).then((content) => {
                movies = extractMovies(content);
                shuffleArray(movies);

                if (movies.length > 1) {
                    diskTextRight.textContent = movies[0].title;
                    diskTextLeft.textContent = movies[1].title;

                    currentMovieIndex = 0;
                }

                if (realFileBtn.value) {
                    chooseTxt.innerHTML = realFileBtn.value.match(
                        /[\/\\]([\w\d\s\.\-\(\)]+)$/
                    )[1];
                } else {
                    chooseTxt.innerHTML = "No file chosen, yet.";
                }

                startDiscAnimation();

            }).catch((error) => console.log(error));
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
};

// Add listeners to buttons that pop up once a movie has been selected
const addMovieSelectedPanelListeners = () => {
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
};

// Read the csv
const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
};

// Extract movies from csv
const extractMovies = (csvContent) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const titleIndex = headers.indexOf('Title');
    const urlIndex = headers.indexOf('URL');

    if (titleIndex === -1 || urlIndex === -1) {
        throw new Error('CSV does not contain required headers: Title, URL');
    }

    const titlesAndUrls = lines.slice(1).map((line) => {
        const columns = line.split(',');

        if (columns.length <= titleIndex || columns.length <= urlIndex) {
            return null;
        }

        const title = columns[titleIndex] ? columns[titleIndex].replace(/"/g, '') : '';
        const url = columns[urlIndex] ? columns[urlIndex].replace(/"/g, '') : '';

        return {
            title: title,
            url: url
        };
    }).filter((item) => item !== null);

    return titlesAndUrls;
};


// Helper function to shuffle the movies
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// Slides in the disk and then starts the rotate disc animation
const startDiscAnimation = () => {
    const discCont = document.querySelector(".disk-container");
    discCont.classList.add("slide-in");
    currentlySpinning = true;
    requestAnimationFrame(rotateDisc);
};

// Primary function for rotating the disc
const rotateDisc = () => {
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
};

// Speeds up rotation when the "pick a movie" button is pressed
const speedUpRotation = () => {
    rotationSpeed = 20;
    currentlySpinning = true;
    // Start slowing down after 3 seconds
    setTimeout(slowDownRotationSpeed, 3000); 
};

const slowDownRotationSpeed = () => {
    interval = setInterval(function () {
        rotationSpeed *= 0.96; // Reduce the speed by 5% each interval

        if (rotationSpeed <= 1) { // Check if the speed is very close to 0
            clearInterval(interval);
            determineTargetAngle();
            approachTargetAngle();
        }
    }, 1000/60);
};


const determineTargetAngle = () => {
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
};


const approachTargetAngle = () => {
    interval = setInterval(function () {
        if (angle <= (targetAngle)) {
            if (angle >= (targetAngle - 100)) {
                rotationSpeed *= 0.99;
            }
            angle = (angle + rotationSpeed) % 360;

            if (angle >= (targetAngle - 5)) {
                angle = targetAngle % 360;
                spinnerElement.style.transform = `rotate(${angle}deg)`;
                clearInterval(interval);

                // Stop the disc
                rotationSpeed = 0;

                // Set this to false so we can restart the disc
                currentlySpinning = false;

                setUpCurrentMovie()
            } else {
                angle = (angle + 360) % 360; // Normalize the angle
                spinnerElement.style.transform = `rotate(${angle}deg)`;
            }
        } else if (angle >= targetAngle && angle <= (targetAngle + 10)) {
            clearInterval(interval);
            rotationSpeed = 0;
            setUpCurrentMovie();
        }
    }, 1000/60); // Use 16ms for smoother animation (approximately 60fps)
};


const setUpCurrentMovie = () => {
    var selectedTitleHTML = document.getElementById("selected-title");
    if (!!!selectedTitleHTML) {
        loadMovieSelectedPanel();
        selectedTitleHTML = document.getElementById("selected-title");
    }

    // Display selected title to screen
    selectedTitleHTML.innerHTML = `<a href="${movies[currentMovieIndex].url}" target="_blank">${movies[currentMovieIndex].title}</a>`;
};
