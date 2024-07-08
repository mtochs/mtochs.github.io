function accordion() {
    const headers = document.querySelectorAll('.questions .question');

    if(headers.length){
        headers.forEach(header => {
            header.addEventListener('click', function (el) {
                const activeHeader = document.querySelector('.question.active');
                if (activeHeader && activeHeader !== header) {
                    activeHeader.classList.remove('active');
                    const currentQuestion = el.currentTarget;
                    if (currentQuestion && currentQuestion.classList.contains('question')) {
                        currentQuestion.classList.toggle('active');
                    }
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    accordion();
})

