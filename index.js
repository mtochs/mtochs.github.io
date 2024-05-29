document.addEventListener('DOMContentLoaded', function() {
    const headers = document.querySelectorAll('.questions .title-min');

    headers.forEach(header => {
        header.addEventListener('click', function (el) {
            const activeHeader = document.querySelector('.question.active');
            if (activeHeader && activeHeader !== header) {

                activeHeader.classList.remove('active');
            }


            const parent = el.currentTarget.parentElement;
            console.log(el)
            if (parent && parent.classList.contains('question')) {
                parent.classList.toggle('active');

            }
        });
    });

   function addDotBtnsAndClickHandlers(emblaApi, dotsNode) {
        let dotNodes = []

        const addDotBtnsWithClickHandlers = () => {
            dotsNode.innerHTML = emblaApi
                .scrollSnapList()
                .map(() => '<button class="embla__dot" type="button"></button>')
                .join('')

            const scrollTo = (index) => {
                emblaApi.scrollTo(index)
            }

            dotNodes = Array.from(dotsNode.querySelectorAll('.embla__dot'))
            dotNodes.forEach((dotNode, index) => {
                dotNode.addEventListener('click', () => scrollTo(index), false)
            })
        }

        const toggleDotBtnsActive = () => {
            const previous = emblaApi.previousScrollSnap()
            const selected = emblaApi.selectedScrollSnap()
            dotNodes[previous].classList.remove('embla__dot--selected')
            dotNodes[selected].classList.add('embla__dot--selected')
        }

        emblaApi
            .on('init', addDotBtnsWithClickHandlers)
            .on('reInit', addDotBtnsWithClickHandlers)
            .on('init', toggleDotBtnsActive)
            .on('reInit', toggleDotBtnsActive)
            .on('select', toggleDotBtnsActive)

        return () => {
            dotsNode.innerHTML = ''
        }
    }

   const emblaNode = document.querySelector('.embla')
   const OPTIONS = { loop: true }
   const emblaApi = EmblaCarousel(emblaNode, OPTIONS)

   const dotsNode = emblaNode.querySelector('.embla__dots')

   const removeDotBtnsAndClickHandlers = addDotBtnsAndClickHandlers(
       emblaApi,
       dotsNode
    )

   emblaApi.on('destroy', removeDotBtnsAndClickHandlers)

    const rangeItems = document.querySelectorAll('.range-item');
    const rangeLabel = document.querySelector('.range-item-label');
    rangeItems.forEach((item, index) => {
        item.style.animation = `rangeItemAnimation .5s forwards`;
        item.style.animationDelay = `${index * (6 / rangeItems.length)}s`;
    })
    rangeItems[rangeItems.length - 1].classList.add('range-itemLast');
    rangeItems[rangeItems.length - 1].style.animation = 'none';



    const startValue = 100000;
    const endValue = 100000000;
    const duration = 6000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = (endValue - startValue) / steps;

    let currentValue = startValue;
    const numberDisplay = document.getElementById('amount');

    const intervalId = setInterval(() => {
        currentValue += increment;
        if (currentValue >= endValue) {
            currentValue = endValue;
            clearInterval(intervalId);
        }
        let displayValue;
        if (currentValue < 1000000) {
            displayValue = (currentValue / 1000).toFixed(0) + 'K';
        } else {
            displayValue = (currentValue / 1000000).toFixed(1) + 'M';
        }
        numberDisplay.textContent = displayValue;
    }, stepDuration);
})

