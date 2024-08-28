const defaultSpeed = 2;

var currentMovieIndex = 0;
var movies = [];
var angle = 0;
var rotationSpeed = defaultSpeed;
var interval;
var targetAngle;
var currentlySpinning = false;

// #region Global document references (cached jQuery selectors)
const $spinnerElement = $('.spinner');
const $diskTextRight = $('.disk-text-right');
const $diskTextLeft = $('.disk-text-left');
const $rightSide = $('#right-side');
const $introTemplate = $('#intro-panel').prop('content');
const $movieSelectedTemplate = $('#movie-selected-panel').prop('content');
const $loadingTemplate = $('#loader').prop('content');
// #endregion

$(document).ready(function () {
    initializeApp();
});

function initializeApp () {
    loadIntroPanel();
    setupInputValidation();
    setupOptionButtons();
}

function setupOptionButtons () {
    $('.option-button').click(function () {
        const targetClass = $(this).data('target');
        $('.selectt').removeClass('active'); // Hide all sections
        $('.' + targetClass).addClass('active'); // Show the selected section
        $('.intitial-buttons').hide();
    });
}

// Function to handle enabling/disabling the button based on input validity
function setupInputValidation () {
    const $input = $('#url');
    const $importButton = $('#import-button');
    const $pickButton = $('#pick-button');

    // Function to check if input is valid
    function validateInput () {
        if ($input.val().trim() !== '' && $input[0].checkValidity()) {
            $importButton.prop('disabled', false); // Enable the Import button
        } else {
            $importButton.prop('disabled', true); // Disable the Import button
            $pickButton.prop('disabled', true); // Disable the Pick button
        }
    }

    // Listen for input changes
    $input.on('input', validateInput);

    // Initial validation on page load in case the input has a value
    validateInput();

    $('#import-button').on('click', async function () {
        const url = $('#url').val().trim(); // Get the input URL value

        if (url) {
            const fetchedMovies = await importMoviesFromWatchlist(url); // Fetch the movies
            if (fetchedMovies.length > 0) {
                // Enable the "Pick a movie" button and handle the movies
                $('#pick-button').prop('disabled', false);
                $('#url').prop('disabled', true);
                $('#import-button').text('Imported').addClass('imported');
                movies = fetchedMovies;
                startDiscAnimation();
            }
        } else {
            console.log('Please enter a valid URL.');
        }
    });
}

function importMoviesFromWatchlist (url) {
    return $.post('/api/movies/', { watchlistUrl: url })
        .done(function (data) {
            // Handle success - assuming 'data' is the list of movies
            console.log('Movies imported:', data);
            return data; // Return the movie list
        })
        .fail(function (error) {
            // Handle failure
            console.error('Error importing movies:', error);
        });
}

// Function to load intro panel
function loadIntroPanel () {
    $rightSide.empty().append($introTemplate.cloneNode(true));
    addIntroPanelListeners();
}

// Function to load movie selected panel
const loadMovieSelectedPanel = () => {
    const $introPanel = $('.intro-panel');
    if ($introPanel.length) {
        $introPanel.addClass('slide-down-dissapear'); // Remove the intro buttons
    }
    $rightSide.empty().append($movieSelectedTemplate.cloneNode(true));
    const $movieSelectedPanel = $('.movie-selected-panel');
    $movieSelectedPanel.addClass('slide-down-appear'); // Add the "movie selected" items
    addMovieSelectedPanelListeners();
};

// Adds loading template to the right side of the screen
const loading = () => {
    $rightSide.empty().append($loadingTemplate.cloneNode(true));
};

const addIntroPanelListeners = () => {
    $('#choose-button').on('click', function () {
        $('#real-file').click();
    });

    $('#real-file').on('change', function (event) {
        const input = event.target;
        if ('files' in input && input.files.length > 0) {
            readFileContent(input.files[0])
                .then(content => {
                    movies = extractMovies(content);
                    shuffleArray(movies);

                    if (movies.length > 1) {
                        $diskTextRight.text(movies[0].title);
                        $diskTextLeft.text(movies[1].title);
                        currentMovieIndex = 0;
                    }

                    $('#choose-text').text(
                        input.files[0].name || 'No file chosen, yet.'
                    );
                    startDiscAnimation();
                })
                .catch(error => console.log(error));
        }
    });

    $('#pick-button').on('click', function () {
        clearInterval(interval); // Clear any existing interval to avoid multiple intervals running simultaneously
        if (currentlySpinning) {
            speedUpRotation();
            loading();
        } else {
            console.log('Disc is not currently spinning');
        }
    });
};

// Add listeners to buttons that pop up once a movie has been selected
const addMovieSelectedPanelListeners = () => {
    $('#respin-button').on('click', function () {
        clearInterval(interval);
        if (!currentlySpinning) {
            rotationSpeed = defaultSpeed;
            requestAnimationFrame(rotateDisc);
            speedUpRotation();
            loading();
        } else {
            console.log('Disc is currently spinning');
        }
    });
};

// Read the csv
const readFileContent = file => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
};

// Extract movies from csv
const extractMovies = csvContent => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const titleIndex = headers.indexOf('Title');
    const urlIndex = headers.indexOf('URL');

    if (titleIndex === -1 || urlIndex === -1) {
        throw new Error('CSV does not contain required headers: Title, URL');
    }

    return lines
        .slice(1)
        .map(line => {
            const columns = line.split(',');
            if (columns.length <= titleIndex || columns.length <= urlIndex) {
                return null;
            }

            const title = columns[titleIndex]?.replace(/"/g, '') || '';
            const url = columns[urlIndex]?.replace(/"/g, '') || '';
            return { title, url };
        })
        .filter(item => item !== null);
};

// Helper function to shuffle the movies
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// Slides in the disk and then starts the rotate disc animation
const startDiscAnimation = () => {
    $('.disk-container').addClass('slide-in');
    $('.selectt').removeClass('fixed');
    currentlySpinning = true;
    requestAnimationFrame(rotateDisc);
};

// Primary function for rotating the disc
const rotateDisc = () => {
    angle = (angle + rotationSpeed) % 360;
    $spinnerElement.css('transform', `rotate(${angle}deg)`);

    if (angle >= 180 && angle < 180 + rotationSpeed) {
        currentMovieIndex = (currentMovieIndex + 1) % movies.length;
        $diskTextRight.text(movies[currentMovieIndex].title);
    }

    if (angle >= 360 || angle < rotationSpeed) {
        currentMovieIndex = (currentMovieIndex + 1) % movies.length;
        $diskTextLeft.text(movies[currentMovieIndex].title);
    }

    if (rotationSpeed > 0) {
        requestAnimationFrame(rotateDisc);
    }
};

// Speeds up rotation when the "pick a movie" button is pressed
const speedUpRotation = () => {
    rotationSpeed = 20;
    currentlySpinning = true;
    setTimeout(slowDownRotationSpeed, 3000);
};

const slowDownRotationSpeed = () => {
    interval = setInterval(function () {
        rotationSpeed *= 0.96;
        if (rotationSpeed <= 1) {
            clearInterval(interval);
            determineTargetAngle();
            approachTargetAngle();
        }
    }, 1000 / 60);
};

const determineTargetAngle = () => {
    const modAngle = angle % 360;
    const distanceTo180 = Math.abs(180 - modAngle);
    const distanceTo360 = Math.abs(360 - modAngle);

    targetAngle = distanceTo180 < distanceTo360 ? 180 : 360;
    if (targetAngle < modAngle) {
        targetAngle += 180;
    }
};

const approachTargetAngle = () => {
    interval = setInterval(function () {
        if (angle <= targetAngle) {
            if (angle >= targetAngle - 100) {
                rotationSpeed *= 0.99;
            }
            angle = (angle + rotationSpeed) % 360;

            if (angle >= targetAngle - 5) {
                angle = targetAngle % 360;
                $spinnerElement.css('transform', `rotate(${angle}deg)`);
                clearInterval(interval);
                rotationSpeed = 0;
                currentlySpinning = false;
                setUpCurrentMovie();
            } else {
                angle = (angle + 360) % 360;
                $spinnerElement.css('transform', `rotate(${angle}deg)`);
            }
        } else if (angle >= targetAngle && angle <= targetAngle + 10) {
            clearInterval(interval);
            rotationSpeed = 0;
            setUpCurrentMovie();
        }
    }, 1000 / 60); // Use 16ms for smoother animation (approximately 60fps)
};

const setUpCurrentMovie = () => {
    let $selectedTitle = $('#selected-title');
    if (!$selectedTitle.length) {
        loadMovieSelectedPanel();
        $selectedTitle = $('#selected-title');
    }

    // Display selected title to screen
    $selectedTitle.html(
        `<a href="${movies[currentMovieIndex].url}" target="_blank">${movies[currentMovieIndex].title}</a>`
    );
};
