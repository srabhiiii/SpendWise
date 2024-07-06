document.addEventListener('DOMContentLoaded', function() {
    let progressbar1 = document.querySelector(".progress1");
    let progressbar2 = document.querySelector(".progress2");
    let val1 = document.querySelector(".pro1val");
    let val2 = document.querySelector(".pro2val");

    // Extract the percentage values from the inner text and convert them to numbers
    let valper1 = parseFloat(val1.textContent);
    let valper2 = parseFloat(val2.textContent);
    
    // Set the background of the progress bars using conic-gradient
    progressbar1.style.background = `conic-gradient(rgb(255, 0, 0) ${3.6 * valper1}deg, rgb(59, 56, 62) ${3.6 * valper1}deg)`;
    progressbar2.style.background = `conic-gradient(rgb(0, 255, 4) ${3.6 * valper2}deg, rgb(59, 56, 62) ${3.6 * valper2}deg)`;
});
