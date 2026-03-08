/*

Alex Norton
a^N 
https://design.alexnortn.com

*/

"use strict";

// jQuery things
let $ = require('jquery');
        require('./jquery.centerIn.js');
        require('lazysizes');
        require('lazysizes/plugins/unveilhooks/ls.unveilhooks.min.js');
        require('is-in-viewport');
        require('./cssTransitionEnd.js');

let _site_content = require('./content.json');

// Module Dependencies
let velocity    = require('velocity-animate'),
    velocity_ui = require('velocity-ui-pack'),
    slick       = require('slick-carousel'),
    hammertime  = require('hammerjs'),
    Stickyfill  = require('stickyfill'),
    isMobile    = require('ismobilejs'),
    animation   = require('./animation.js');

// Bower Dependencies
let bower_url = '../bower_components/';

// External Scripts
let ProgressBar = require('./progressBar.js');

// Userlist data array for filling in info box
let userListData = [],
    case_studies,
    projects,
    menu = false;

let _sections = $('.section'),
    _sectionCurrent,
    _$projectCurrentContents = null;

let stickyfill = Stickyfill();
// let widowtamer = WidowTamer();

let _mobile;

let _projectCurrentId,
    _hashChanged = false,
    _closeProject,
    _endeavor_routes,
    _videoHandler;

let _itemInteraction,
    _endeavorRouter;

let _state = {
    "sectionHeight": Infinity,
    "progressBar" : "",
    "siteContent": _site_content
};

// Global for interacting with glyph
window._openProjectState = false,


    // attachFastClick = require('fastclick');    


// DOM Ready =============================================================
$(document).ready(function() {
    if (isMobile.tablet || isMobile.phone) {
        _mobile = true;
    }

    setGreeting();

    // Parse Contents
    _endeavor_routes = {
        projects: [],
        case_studies: []
    };

    // Setup Case Studies
    _site_content.case_studies.forEach(function(item) {
        _endeavor_routes.case_studies.push(item.route);    
    });

    // Setup Projects
    _site_content.projects.forEach(function(item) {
        _endeavor_routes.projects.push(item.route);    
    });    

    // Call pagination
    new Promise((resolve, reject) => {
        pagination(_sections);        
        resolve();
    })
    .then(() => {
        $('#pagination').alwaysCenterIn(window, { direction: 'vertical' });
        paginationUpdate(_sectionCurrent);
    })
    .then(() => {
        _endeavorRouter.initialRoute(window.location.pathname.slice(1)); // Initial Page Routing => No Animation
        hashChanged();
    })
    .then(() => {
        setTimeout(() => {
            // Intro loader
            $.Velocity.animate( $('.loader'), "fadeOut", { duration: 1000 })
            .then(function(elements) {
                setTimeout(function() {
                    $('body').addClass('body-loaded');
                }, 0);
            })
            .catch(function(error) { 
                console.log("Rejected.");
            });
        }, 0);
    })
    .catch((reason) => {
        console.log('promise rejected for ' + reason);
    });

    window.addEventListener('popstate', function(event) {
        hashChanged();
        _endeavorRouter.route(event.state); // Event handler for History state change
    }, false);

    stickyUpdate();

    _closeProject = closeProject; // Set up close project global

    // Set dynamic media size + aspect ratio
    function setupMedia($elem = null) {
        if ($elem === null) {
            if (_$projectCurrentContents === null) {
                return;
            }

            $elem = _$projectCurrentContents;
        }

        let width =  $elem.innerWidth(),
            height =  width * 9/16;
            
            width = width + "px";
            height = height + "px";

            $('.media-frame').css('width', width)
                             .css('height', height);

            $('.media-settings').css('height', height);

    }

    
    // ------------------------------------------------------------------------
    // Event Handlers

    $(window).resize(function() {
        stickyUpdate();
        setupMedia();

        if (_mobile) { // Disable blur effect on mobile devices + tablets
            return;
        }

        let timer;

        clearTimeout(timer);

        // $('#wrapper').addClass('resize-window');
        
        // timer = setTimeout(function() {
        //     $('#wrapper').removeClass('resize-window');
        // }, 500);
    });

    // window.addEventListener('scroll', function(e) {
    //     $('.scroll-arrow').velocity("fadeOut", { duration: 250 });
    // }, {passive:true});

    // Bios Button
    $('#bios-button').click(function() {
        $(this).velocity("fadeOut", { duration: 500 });
        $('#long').velocity("fadeIn", { delay: 500, duration: 666 });
    });

    // Header navigation | JS Interaction
    $('#nav-trigger').click(function() {
        let e = document.getElementById("nav-trigger");
        $("body").toggleClass("nav-open");

    });   

    // Close navigation overlay
    function closeNav() {
        document.getElementById("nav-trigger").checked = false;
    }

    // Get Event Target
    function getEventTarget(evt) {
        evt = evt || window.event;
        return evt.target || evt.srcElement; 
    }

    // Navigation
    $('#web-lab-nav').click(function() {
        let target = getEventTarget(event);
        _sectionCurrent = target.getAttribute('data-nav');
        closeNav(); // Close Section

        closeProject();

        animation.scrollToVelocity(_sectionCurrent); // Navigate
    });

    // Video audio toggle
    $(".video-toggle").click( function (){
        $(this).siblings().prop('muted', !$(this).siblings().prop('muted'));
        
        if ($(this).find('.fa-volume-up').hasClass('hidden')) {
            $(this).find('.fa-volume-up').removeClass('hidden');
            $(this).find('.fa-volume-off').addClass('hidden');
        } 
        else {
            $(this).find('.fa-volume-up').addClass('hidden');
            $(this).find('.fa-volume-off').removeClass('hidden');  
        } 
        
    });

    // Autoplay Videos
    _videoHandler = function(container) {
        $(container).find('video').each(function(item) {
            if (this === undefined) {
                return;
            }
            if (this.HAVE_ENOUGH_DATA === 4) { // Asset loaded
                videoControl(this);
            }
            else {
                new Promise((f, r) => {
                    if (this.HAVE_ENOUGH_DATA === 4) { // Asset loaded
                            f(this);
                    }
                })
                .then(function(elem){
                    videoControl(elem);
                })
                .catch(function(reason) {
                });
            }
        });

        function videoControl(elem) {
            if ($(elem).is(":in-viewport")) {
                const playPromise = $(elem)[0].play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Auto-play was prevented
                        console.log('Video autoplay prevented:', error);
                    });
                }
            }
            else {
                $(elem)[0].pause();
            }
        }
    }

    // Toggle project "reveal" sections
    // Important -> Naming schema:
    //  + effected element id -> "ghost-something-affect"
    //  + button class ->        "endeavor-button-reveal"
    //  + button id ->           "ghost-something"

    $('.endeavor-button-reveal').click(function(evt) {
        let affect_div = "#" + this.id + "-affect";
        $(affect_div).removeClass('endeavor-reveal');
        $(this).parent().velocity("fadeOut", { duration: 250 });
    });

    function createCircle(_cx, _cy) {
        let svgNS = "http://www.w3.org/2000/svg";  
        let myCircle = document.createElementNS(svgNS, "circle");
            myCircle.setAttribute("class", "transition-svg");
            myCircle.setAttributeNS(null,"id", "mycircle");
            myCircle.setAttributeNS(null,"cx", _cx);
            myCircle.setAttributeNS(null,"cy", _cy);
            myCircle.setAttributeNS(null,"r", 0);
            myCircle.setAttributeNS(null,"stroke", "none");

        document.getElementById("svg-container").appendChild(myCircle);

        return $('.transition-svg');
    }      

    function closeProject() {
        let transition = false;

        $('#fx-container').removeClass('opaque').onCSSTransitionEnd( function() {

            if (transition) {
                return;
            }

            // Remove ProgressBar
            if (_state.progressBar) {
                _state.progressBar.destroy();
                _state.progressBar = null;
            }

            $( this ).addClass('passive');
            $('#content-wrapper').removeClass('visibility-hidden');

            $('.endeavor-container').removeClass('visible')

            setTimeout(function() {
                $('.endeavor-container').removeClass('flex-row');
            }, 1000);

            $('.arrow-container').removeClass('arrow-bottom disabled')
                                 .addClass('transparent');

            $('body').removeClass('endeavor-open');

            $('#pagination').velocity("fadeIn", { duration: 500 });
                window._openProjectState = false;

            transition = true;

            // Internal URL Routing + Hashing
            _endeavorRouter.resetURL();
            _endeavorRouter.setHash("works");

        });
    } 

    // Project Grid Handlers
    _itemInteraction = function() { // For lexical scoping
        let current_index = 0,
            active = false,
            container,
            case_studies = $('.case-study-view').toArray(),
            projects = $('.project-view').toArray(),
            currents = [],
            scrollHandler,
            resizeHandler,
            project_id; 

        let captureScrollHandler = function(evt) {
            evt.stopPropagation();
        }

        function updateCurrentProject(index, current_id) {
            let new_id = '#' + currents[index].id;
            let timer_height;
            updateProjectHandlers(current_id, new_id, timer_height);

            return new_id;
        }

        function resetProjectControls() {
            $('.arrow-container').removeClass('arrow-bottom');
        }

        function updateProjectHandlers(current_id, new_id, timer_height) {
            _state.sectionHeight = Infinity;

            if (scrollHandler) {
                $(current_id).off("scroll", scrollHandler);
            }

            if (resizeHandler) {
                $(window).off("resize", resizeHandler);
            }

            if (timer_height) {
                window.clearTimeout(timer_height);
            }

            if (_state.progressBar) {
                _state.progressBar.reset()
                .then(() => {
                    _state.progressBar = new ProgressBar ({
                        scrollContainer: new_id,
                        maxHeight:_state.sectionHeight,
                    });
                });
            }
            else {
                _state.progressBar = new ProgressBar ({
                    scrollContainer: new_id,
                    maxHeight:_state.sectionHeight,
                });
            }

            timer_height = window.setTimeout(function() {
                calcSectionHeight();
            }, 1000);

            function calcSectionHeight() {
                let children = "." + $(new_id).children().attr("class") + " > *";
                    _state.sectionHeight = 0; // Reset height

                $(new_id).find(children).each(function () {
                    _state.sectionHeight += $(this).outerHeight();
                });

                // Correct for viewport
                _state.sectionHeight -= window.innerHeight;

                if (_state.progressBar) {
                    _state.progressBar.updateOffset();
                }
            }

            scrollHandler = function() {
                if ($(new_id).scrollTop() > 0) {
                    $('.arrow-container').addClass('arrow-bottom');
                    $('.arrow-center').addClass('visible');
                    $('#prev').addClass('arrow-left-alt');

                    let value = $(new_id).scrollTop() / _state.sectionHeight;

                    // Toggle next-arrow open
                    if (value > 0.75 && !active && !_mobile) {
                        $('#next').addClass('next-active');
                        active = true;
                    } 
                    else if (value < 0.75) {
                        active = false;
                        $('#next').removeClass('next-active');
                    }

                    if (_state.progressBar.exist) {
                        _state.progressBar.update(value);
                    }
                }
                else {
                    $('.arrow-container').removeClass('arrow-bottom');
                    $('.arrow-center').removeClass('visible');
                    $('#prev').removeClass('arrow-left-alt');
                }
            }

            resizeHandler = function() {
                calcSectionHeight();
            }

            let timer, timer2;
            $(new_id).scroll(function() {
                if (timer) {
                    window.clearTimeout(timer);
                }

                if (timer2) {
                    window.clearTimeout(timer2);
                }

                timer = window.setTimeout(function() {
                    scrollHandler();
                }, 10);

                timer2 = window.setTimeout(function() {
                    _videoHandler(new_id);
                }, 50);
            });

            $(window).resize(function() { resizeHandler() });
        }

        function updateArrow() {
            if (current_index >= currents.length - 1) {
                $('#next').addClass('disabled');
            }
            else {
                $('#next').removeClass('disabled');
            }

            if (current_index <= 0) {
                $('#prev').addClass('disabled');
            }
            else {
                $('#prev').removeClass('disabled');
            }
        }

        function workItemInteraction(_project_id, evt, animate=true) {
            // Testing for touch || click
            let x_pos,
                y_pos;

            let $currentTarget;

            if (evt.type === "click") {
                x_pos = evt.clientX;
                y_pos = evt.clientY;

                $currentTarget = $(evt.currentTarget);

            }
            else if (evt.pointerType === "touch") {
                x_pos = evt.pointers[0].screenX;
                y_pos = evt.pointers[0].screenY;

                $currentTarget = $(evt.target.closest('.item'));

            }
            else if (evt instanceof jQuery) { // For URL Routing
                x_pos = window.innerWidth / 2;
                y_pos = window.innerHeight / 2;

                $currentTarget = evt;               
            }

            project_id = _project_id;

            if (!$currentTarget) {
                return;
            }

            // Target list to iterate through
            if ($currentTarget.hasClass('case-study-item')) {
                currents = case_studies;
                container = $('.case-study-container');
            }
            else if ($currentTarget.hasClass('project-item')) {
                currents = projects;
                container = $('.project-container');
            }

            currents.forEach(function(project_item, index) {
                if (project_item.id === project_id) {
                    current_index = index;
                    updateCurrentProject(current_index, project_id);
                }
            });

            updateArrow();

            project_id = "#" + project_id;
            let opaque = false;

            // Setup Slick
            let bottomSlick = $(project_id).find('.endeavor-image-slider');
            if (!bottomSlick.hasClass('slick-initialized')) { 
                bottomSlick.children().each(function() { lazySizes.loader.unveil(this) });
                
                addSlick(bottomSlick, true);
                bottomSlick.slick('slickNext')
                           .slick('slickNext')
                           .slick('slickNext')
                           .slick('slickGoTo', 0, false)
                           .slick('slickGoTo', 1, false)
                           .slick('slickGoTo', 0, false);
            }

            $('#fx-container').removeClass('passive');
            $('#content-wrapper').addClass('visibility-hidden');

            let $transitionSVG = createCircle(x_pos, y_pos);

            let slide_duration = animate ? 750 : 1; // Flag for instantaneous animation

            $('#pagination').velocity("fadeOut", { duration: (slide_duration * 0.75) });

            $.Velocity.animate( $transitionSVG, { r: 2000 }, { duration: slide_duration },  "ease-out" )
            .then(function(elements) {
                $('body').addClass('endeavor-open');
                
                container.addClass('flex-row');

                $.Velocity.animate( $(project_id), "scroll", { axis: "x", duration: slide_duration, container: container })
                .then(function(elems) {
                    $(project_id).scrollTop(0);     // Reset project scroll             
                    container.addClass('visible')
                
                    $('#fx-container').addClass('opaque').onCSSTransitionEnd( function() { 
                        if (opaque) {
                            return;
                        }

                        $.Velocity.animate( $transitionSVG, "fadeOut", { duration: (slide_duration * 0.75) } )
                        .then(function(elements) {
                            $('.arrow-container').removeClass('transparent');
                            
                            _$projectCurrentContents = $(project_id).find('.contents');
                            setupMedia(_$projectCurrentContents); // Resize Video players

                            $transitionSVG.remove();
                        })
                        .catch(function(error) { 
                            console.log("Rejected.");
                        });

                        opaque = true;

                    });

                })
                .catch(function(error) { 
                    console.log("Rejected.");
                });
            });

            window._openProjectState = true;


            // Lazysizes configuration
            window.lazySizesConfig = window.lazySizesConfig || {};
            window.lazySizesConfig.expand = 10; // Loading offset
            window.lazySizesConfig.expFactor = 10; // Loading offset
        }

        // --------------------------------------
        // Project Event Handlers

        $('.item').on('click', function(evt) {
            evt.stopPropagation();
            workItemInteraction($(this).attr('data-project'), evt); 
            _endeavorRouter.setURL($(this).attr('data-project')); // Internal URL Routing
        });

        $('.item').each(function(){
            let $this = $(this);

            let hammertime = new Hammer(this);
                hammertime.options.domEvents = true; // Support for event delegation
                hammertime.on("tap", function(evt) {
                    evt.preventDefault();
                    workItemInteraction($(evt.target.closest('.item')).attr('data-project'), evt);
                    _endeavorRouter.setURL($(evt.target.closest('.item')).attr('data-project')); // Internal URL Routing
                    return false;
                });
        });
 
        // To previous project
        $('#prev').click(function(evt) {
            if (!window._openProjectState) {
                return;
            }

            if (current_index >= 1) {
                current_index--;
                project_id = updateCurrentProject(current_index, project_id);
                
                _endeavorRouter.setURL(project_id.substring(1)); // Internal URL Routing

                $('.arrow-container').removeClass('dip-to-white');
                // $('.project-container').removeClass('dip-to-white');

                resetProjectControls();
                
                $(project_id).scrollTop(0)     // Reset project scroll                        
                $(project_id).velocity("scroll", { axis: "x", duration: 750, container: container, easing: 'ease-in-out' }); // Scroll to next project
                
                updateArrow();

                setTimeout(function() {
                    $('.arrow-container').addClass('dip-to-white');
                    // $('.project-container').addClass('dip-to-white');
                }, 0);
            }
        });

        // To next project
        $('#next').click(function(evt) {
            if (!window._openProjectState) {
                return;
            }

            if (current_index < currents.length - 1) {
                current_index++;
                project_id = updateCurrentProject(current_index, project_id);

                _endeavorRouter.setURL(project_id.substring(1)); // Internal URL Routing

                $('.arrow-container').removeClass('dip-to-white');
                // $('.project-container').removeClass('dip-to-white');

                resetProjectControls();

                $(project_id).scrollTop(0)     // Reset project scroll             
                $(project_id).velocity("scroll", { axis: "x", duration: 750, container: container, easing: 'ease-in-out' }); // Scroll to next project
                
                updateArrow();

                setTimeout(function() {
                    $('.arrow-container').addClass('dip-to-white');
                    // $('.project-container').addClass('dip-to-white');
                }, 0);
            }
        });

        // Close project handler
        $('#close').click(function(evt) {
            if (window._openProjectState) {
                closeProject();
            }
        });

        // Resize
        $(window).resize(function(evt) {
            let timer;

            clearTimeout(timer);
            
            timer = setTimeout(function() {
                $(project_id).velocity("scroll", { axis: "x", duration: 0, container: container }); 
            }, 500);
        });

        return {
            workItemInteraction: function(_project_id, evt, animate) {
                workItemInteraction(_project_id, evt, animate);
            }
        }

    }();


    // --------------------------------------
    // Image-Grid Overlay

    $('.image-grid-container').click(function() {
        
        let $containerClass    = $(this).parent(),  
            $slickInitClass    = $containerClass.find('.grid-slider'),
            slideIndex        = $(this).data('slide');

        $(this).parent().find('.unveil').trigger('unveil'); // Trigger loading of slider

        $containerClass
            .children('.image-grid-container')
                .removeClass("active-grid")
                .addClass("bounce-sm");

        $(this)
            .removeClass("bounce-sm")
            .addClass("active-grid");

            
        if (!$slickInitClass.hasClass('slick-initialized')) {    
            
            $containerClass
                .children('.image-grid-container')
                    .removeClass("bounce")
                    .addClass('bounce-sm shrink-grid');
                
            $slickInitClass.addClass('active-grid-slider');

            // Add Slick slider with current parent id
            addSlick($slickInitClass, false, false);
                $slickInitClass.removeClass('slider-transition');

                // Wait to calculate page offset until class transition ends
                setTimeout(
                    function(evt) {

                        let scrollInId = $('.case-study-view');

                        $(this).velocity("scroll", { 
                            container: scrollInId,
                            duration:  800,
                            delay:     0,
                            mobileHA:  false
                        });

                }, 500);

            $slickInitClass.slick('slickGoTo', slideIndex, true);   // Do not animate to first position

        } 
        else {
            $slickInitClass.slick('slickGoTo', slideIndex, false);  // Once loaded, animate to new position
        }

        $slickInitClass.on('swipe', function(event) {
            
            $containerClass
                .children('.image-grid-container')
                    .removeClass("active-grid")
                    .addClass("bounce-sm");

            let currentSlide = $slickInitClass.slick('slickCurrentSlide');
            let activeSlide  = $containerClass
                                    .find("[data-slide='" + currentSlide + "']");
                activeSlide
                    .addClass("active-grid")
                    .removeClass("bounce-sm");
        });
    });

    // Pagination event listener
    $('.pagination').click(function() {

        _sectionCurrent = $(this).attr("data-sectionId");

        // Navigate
        animation.scrollToVelocity(_sectionCurrent);

    });

    // Header navigation --> Go Home (clicking 'a' sends the users to /#bios)
    $('.logo').click(function(){
        
        closeProject();
        closeNav();

        _sectionCurrent = "web-lab"; // Set #web-lab as current
        animation.scrollToVelocity(_sectionCurrent); // Navigate

    });

    $('.scroll-arrow').click(function() {
        _sectionCurrent = "bios"; // Set #bios as current
        animation.scrollToVelocity(_sectionCurrent); // Navigate
        // $(this).velocity("fadeOut", { duration: 250 }); // Fade it out | They get it
    });


    // --------------------------------------
    // Widow Tamer

    // if (_mobile) {
    //     wt.fix({
    //         elements: '.tamer',
    //         chars: 14,
    //         method: 'letter-spacing',
    //         event: 'orientationchange'
    //     });
    // }
    // else if (window.innerWidth > 400) {
    //     wt.fix({
    //         elements: '.tamer',
    //         chars: 14,
    //         method: 'letter-spacing',
    //         event: 'resize'
    //     });
    // }


    // --------------------------------------
    // Sticky Elements

    function stickyUpdate() {
        let stickyElements = $('.sticky');

        stickyfill.kill(); // --> Reset
        
        if (_mobile || window.innerWidth < 1000) {
            stickyfill.kill();
            return;
        }

        for (let i = stickyElements.length - 1; i >= 0; i--) {
            stickyfill.add(stickyElements[i]);
        }

        stickyfill.rebuild();
    }


    // --------------------------------------
    // Mobile

    // Hide Web-Lab ~before 2021
    // if (_mobile) {
    //     $('#web-lab').addClass('hidden');
    // }

    /*
        Alternative check for mobile devices

        _mobile = window.mobilecheck = (function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
            
            return check;
        })(); // Call immediately
    */

    $('#bios-more').click(function() {
        $(this).velocity("fadeOut", { duration: 500 });
        $('#bios-about').velocity("fadeIn", { duration: 250 });
        $('#self-long').velocity("fadeIn", { duration: 500 });
    });

    $('#select-more').click(function() {
        $(this).velocity("fadeOut", { duration: 500 });
        $('#select-work li:nth-child(n+7)').velocity("fadeIn", { duration: 500 });
    });

    // Close Project
    $('.close').click(function() {
        closeCasestudy();
    });    

});

// Functions =============================================================


// Page load routing + hashing
_endeavorRouter = function() {

    // Set current url hash
    let loaded;
    let _sections = $('.section');

    function route(state, animate) {

        // If the user requests the index page, redirect to #web-lab
        if ((state === "home") || (state === "")) { // If the user requests the index page, redirect to #web-lab
            window.location.hash = "web-lab";
            _sectionCurrent = $(_sections).index($('#web-lab')); // Set #web-lab as current
            hashChanged('#web-lab');
            loaded = true;
        }
        else if ( window.location.pathname === "/" ) {
            if (!window._openProjectState) {
                return;
            }
            
            $('.arrow-container').addClass('transparent');
            _closeProject(); // Exit project
            hashChanged('#web-lab');

            $('.arrow-container-main').addClass('transparent');
            
            setTimeout(function() { // Currently a hack for avoinding deferred Velocity Animation
                $('.arrow-container-main').removeClass('transparent');
                $('.arrow-container').addClass('transparent');
            }, 2000);

            _sectionCurrent = $(_sections).index($('#works')); // Set #works as current
        }
        else {
            // Check for Project Incoming Routing
            for (let i = 0; i < _endeavor_routes.case_studies.length; i++) {
                let item = _endeavor_routes.case_studies[i];

                if (state === item) {
                    setTimeout(function() {
                       _itemInteraction.workItemInteraction(item, $('.case-study-item'), animate);
                    }, 0);

                    _sectionCurrent = $(_sections).index($('#works')); // Set #works as current
                    return;
                }
            }

            // Check for Case Study Incoming Routing
            for (let i = 0; i < _endeavor_routes.projects.length; i++) {
                let item = _endeavor_routes.projects[i];

                if (state === item) {
                    setTimeout(function() {
                       _itemInteraction.workItemInteraction(item, $('.project-item'), animate);
                    }, 0);

                    _sectionCurrent = $(_sections).index($('#works')); // Set #works as current
                    return;
                }
            }

            // Find requested route
            let loc = window.location.hash;
            // Set current object to this route
            _sectionCurrent = $(_sections).index($(loc));
        }

        $(_sections).removeClass('currentSection');

        $( _sections[ _sectionCurrent ] )
            .addClass('currentSection')
            .velocity("scroll", { duration: 1});
    }

    function initialRoute(state) {
        route(state, false); // animate flag for project transition
    }

    // Closure
    return {
        route: function(state) {
            route(state, true);
        },
        initialRoute: function(state) {
            initialRoute(state, false);
        },
        resetURL: function() {
            window.history.pushState('home', "", "/"); // Update browser state without refreshing the page
        },
        setHash: function(hash) {
            window.location.hash = "#" + hash;
        },
        setURL: function(URL) {
            if (URL) {
                window.history.pushState(URL, "", "/" + URL); // Update browser state without refreshing the page
            }
        }
    }
}();

// Dynamic page hash setting (anonymous fn)
(function () {
    // Find all top,bottom and Hash of each sections
    let section = $.map($("section"), function (e) {
        let $e = $(e);
        let pos = $e.position();
        return {
            top: pos.top - 100,
            bottom: pos.top - 100 + $e.height(),
            hash: $e.attr('id')
        };
    });
     // Checking scroll 
    let top = null;
    let changed = false;
    let currentHash = null;

    $(document).scroll(function () {
        let newTop = $(document).scrollTop();
       
        changed = newTop != top;

        if (changed) {
            top = newTop;
        }
    });
  
    //Set Hash while start scroll | check only every 200ms
    function step() {
        if (!changed) {
            return setTimeout(step, 200);
        }

        let count = section.length,
            p;

        while (p = section[--count]) {
            if (p.top >= top || p.bottom <= top) {
                continue;
            }
            if (currentHash === p.hash) {
                break;
            }
            
            let scrollTop = $(document).scrollTop();
            window.location.hash = currentHash = p.hash;

            _sectionCurrent = p.hash;
            
            // prevent browser to scroll
            $(document).scrollTop(scrollTop);
        }

        setTimeout(step, 200);
    }

    setTimeout(step, 200);

})();

// Toggle visibility of main logo
function toggleLogo(loc) {
    let header = $('#header');

    if (loc === "#web-lab") { 
        header.removeClass('header-open');
    } else {
        header.addClass('header-open');
    }
}

// Toggle visibility of Glyph Controls
function toggleGlyphControls(loc) {

    if (loc === "#web-lab") { 
        $('.lab-options').velocity("fadeIn", { duration: 250, display: "flex" });
        $('.lab-what').velocity("fadeIn", { duration: 250, display: "flex" });
    } else {
        $('.lab-options').velocity("fadeOut", { duration: 250 });
        $('.lab-what').velocity("fadeOut", { duration: 250 });
    }
}

// Control Header or Anything else Hash related
function hashChanged() {
    let loc = window.location.hash;

    toggleLogo(loc); // Check the logo visibility
    toggleGlyphControls(loc) // Check weblab control visibility

    let sectionUpdate = String(loc).slice(1);

    // Affect pagination on navigation change
    paginationUpdate(sectionUpdate);
};

// Setup Pagination
function pagination(_sections) {

    $(_sections).each(function(i, obj) {

        let id = $(this).attr('id');

        // For each element with '_sections' class; append new pagination to dom.
        $('#pagination').append('<div class = "pagination"></div>');
        $('.pagination').eq(i).attr( 'data-sectionId', id );
        $('.pagination').eq(i).attr( 'data-content', id );

    });

}

// Update pagination active states
function paginationUpdate(sectionUpdate) {
    $('.pagination').removeClass('pagination-active');
    let active_section = $('#pagination').find("[data-sectionId='" + sectionUpdate + "']");
        active_section.addClass('pagination-active pagination-active-before');

    setTimeout(function() {
        active_section.removeClass('pagination-active-before');
    }, 2000
    );
}


// Setup for Slick slider plugin Grid #1
function addSlick($elem, _dotsBool, _autoplay = true) {

    $elem.slick({
        arrows:             false,
        pauseOnHover:       true,
        autoplay:           _autoplay,
        dots:               _dotsBool,
        lazyLoad:           'on-demand',
        adaptiveHeight:     true
    });
}

function centerOffest(scrollInId, scrollToId) {

    let elementOffset = scrollToId.offset().top,
        distance      = (elementOffset - scrollTop),
        middle        = distance - $(scrollInId).height()/2;

    return middle;
}

// Set up Date Query
function setGreeting() {

    // Get current time
    let d = new Date(),
        n = d.getHours(),
        greeting;

    if ((n < 11) && (n > 4)) {
        greeting = "Good Morning ";
    } else if ((n < 18) && (n > 10)) {
        greeting = "Good Afternoon ";
    } else if ((n > 17) || (n < 5)) {
        greeting = "Good Evening ";
    } else {
        greeting = "Hello ";
    }

    // Add the greeting to the very first interactive section*/
    $('#greeting p:first-child').html(greeting);
}

/*


Seperation of styling for complex page animations


*/


// Set up page-load animation

let $info          = $("#info"),
    $navBurger     = $('#nav-burger'),
    $pagination    = $('#pagination'),
    $navFooter     = $('.nav-footer');


let loadingSequence = [
    {
        e: $navBurger,
        p: {
            right: 50,
            opacity: 1 
        },
        o: {
            duration: 500,
            easing: "easeInSine",
            sequenceQueue: false
        }
    },
    {
        e: $pagination,
        p: {
            right: 57, 
        }, 
        o: {
            duration: 500,
            easing: "easeInSine",
            sequenceQueue: false
        }
    },
    { 
        e: $info,
        p: { opacity: 1 },
        o: { 
            duration: 500,
            easing: "easeInSine",
            sequenceQueue: false
        }
    },
    { 
        e: $navFooter,
        p: { bottom: 0 },
        o: { 
            duration: 500,
            easing: "easeInSine",
            sequenceQueue: false
        }
    }
]


// jQuery Extentions =============================================================

$.fn.appendAttr = function(attrName, suffix) {
    this.attr(attrName, function(i, val) {
        return val + suffix;
    });
    return this;
};

// scrollTo

/* sigmoidFactory
*
* Generate an ease-in-out function with desired steepness.
* https://medium.com/analytic-animations/ease-in-out-the-sigmoid-factory-c5116d8abce9#.riq7ob6tj
* 
* Required:
*   k: (float != 0), sharpness of ease
*
* Return: f(t), t in 0..1
*/
function sigmoidFactory(k) {
    function base(t) {
        return 1 / (1 + Math.exp(-k * t)) - 0.5;
    }

    let correction = 0.5 / base(1);

    return function (t) {
        t = clamp(t, 0, 1);
        return correction * base(2 * t - 1) + 0.5;
    };
}

function clamp(val, lower, upper) {
    return Math.max(Math.min(val, upper), lower);
}

function Deferred(fn) {
    fn = fn || function () {};

    let res = void 0,
        rej = void 0;

    let p = new Promise(function (resolve, reject) {
        fn(resolve, reject);

        res = resolve;
        rej = reject;
    });

    p.resolve = res;
    p.reject = rej;

    return p;
}

/* scrollTo
 *
 * Smoothly scrolls to a particular element.
 *
 * Required:
 *   [0] target: The element to scroll to
 *
 * Optional:
 *     msec: defaults to 250 msec
 *     easing: defaults to ease-in-out-cubic
 *     offset: extra offset in pixels
 *
 * Return: void
 */
function scrollTo(container, target, options) {
    if (target === null) {
        target = container;
    }

    if (options === undefined || typeof options === 'function') {
        options = {};
    }

    let msec = options.msec || 250;
    let easing = options.easing || sigmoidFactory(6);
    let offset = options.offset || 0;

    let position_offset = target.offsetTop - container.offsetTop + offset;

    if (position_offset === 0) {
        return Promise.resolve();
    }

    let distance_traveled = 0;
    let start_pos = container.scrollTop;

    let req;

    let deferred = Deferred();

    deferred.then(function () {
        container.scrollTop = start_pos + position_offset;
    }, function () {
        if (req) {
            cancelAnimationFrame(req);
        }
    });

    let start_time = window.performance.now();

    function animate() {
        let now = window.performance.now();
        let t = (now - start_time) / msec;

        if (t >= 1) {
            deferred.resolve();
            return;
        }

        let proportion = easing(t);

        distance_traveled = proportion * position_offset;
        container.scrollTop = start_pos + distance_traveled;

        req = requestAnimationFrame(animate);
    }

    req = requestAnimationFrame(animate);

    return deferred;
};