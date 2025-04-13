// Remove previous parallax scroll listener
// document.addEventListener('scroll', function() { ... });

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial size

const numStars = 300; // Adjust for density
const stars = [];

function initStars() {
    stars.length = 0; // Clear existing stars on resize
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5, // Size range
            alpha: Math.random() * 0.5 + 0.5, // Opacity range
            speed: Math.random() * 0.3 + 0.1 // Speed range (pixels per frame)
        });
    }
}

initStars();
window.addEventListener('resize', initStars); // Re-initialize stars on resize

function animateStars() {
    // Clear canvas with a subtle background color
    ctx.fillStyle = '#050810'; // Match body background idea
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e0e0ff'; // Star color

    stars.forEach(star => {
        // Move star
        star.y += star.speed;

        // Wrap around vertically
        if (star.y > canvas.height + star.radius) {
            star.y = 0 - star.radius;
            star.x = Math.random() * canvas.width; // Re-randomize x position
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.globalAlpha = star.alpha;
        ctx.fill();
    });

    ctx.globalAlpha = 1.0; // Reset global alpha

    requestAnimationFrame(animateStars); // Loop animation
}

animateStars();

// --- Contact Form Handling ---
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const statusElement = document.getElementById('form-status');

    // Basic obfuscation (split parts, join later)
    const part1 = "mike";
    const part2 = ".ochs";
    const domain1 = "stellat";
    const domain2 = ".us";
    const recipient = part1 + part2 + '@' + domain1 + domain2; // mike.ochs@stellat.us

    const subject = `Website Contact Form Submission from ${name}`;
    let body = `Name: ${name}\nEmail: ${email}\n`;
    if (message) {
        body += `\nMessage:\n${message}`;
    }

    // Encode for mailto link
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Attempt to open mail client
    try {
        window.location.href = mailtoLink;
        statusElement.textContent = 'Your email client should open. Please send the message.';
        // Clear form (optional)
        // document.getElementById('contactForm').reset();
    } catch (e) {
        statusElement.textContent = 'Could not open email client. Please copy details manually.';
        console.error("Mailto link error:", e);
        // Optionally display the mailto link for manual copying
        // statusElement.innerHTML += `<br><a href="${mailtoLink}">Click here to try manually</a>`;
    }
}); 