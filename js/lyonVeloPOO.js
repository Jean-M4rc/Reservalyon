// ------------------------------------------------------- //
// ----------------------- GOOGLE MAP -------------------- //
// ------------------------------------------------------- // 
// Gère la création de la map, l'ajout des marker, et le clic 
// sur les marker

var marker;
var map;

function initMap(reponse) {
    
    //Ici on déclare l'objet map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 45.75,
            lng: 4.85
        },
        zoom: 13,
        streetViewControl: false,
        mapTypeControl: false
    });
    
    //Avec la requete AjaxGet on va demander à l'API JCDECAUX les données
    // sur les stations, et créer les marqueurs correspondant aux infos récoltées
    ajaxGet("https://api.jcdecaux.com/vls/v1/stations?contract=Lyon&apiKey=b2baed99922af84343e0e7fa65d767d541744692", function (reponse) {

        var stations = JSON.parse(reponse);
        var markers = [];

        function createMarker() {

            var dispo = ((stations[i].available_bikes));

            if (stations[i].status === "CLOSED") {
                image = 'images/velomini-closed.png';
                used = "La station est fermée pour travaux.";
            } else if (dispo == 0) {
                image = 'images/velomini-empty.png';
                used = "La station est vide.";
            } else if (dispo < 0.2 * (stations[i].bike_stands)) {
                image = 'images/velomini-rouge.png';
                used = "La station est presque vide.";
            } else if (dispo < 0.5 * (stations[i].bike_stands)) {
                image = 'images/velomini-orange.png';
                used = "La station est très utilisée.";
            } else {
                image = 'images/velomini-vert.png';
                used = "La station est bien remplie.";
            }

            marker = new google.maps.Marker({

                position: stations[i].position,
                name: stations[i].name,
                address: stations[i].address,
                status: stations[i].status,
                bike_stands: stations[i].bike_stands,
                available_bike_stands: stations[i].available_bike_stands,
                available_bikes: stations[i].available_bikes,
                map: map,
                used: used,
                icon: image,
                indice: i
            });

            markers.push(marker);
            marker.addListener('click', function () {
                
                //on initialise l'objet à réserver et on l'affiche dans l'infoBox
                etatStat.init(this.status, this.name, this.address, this.available_bike_stands, this.available_bikes, this.used, this.icon, this.indice);
                animDom.showEtat();
                map.setZoom(17);
                map.setCenter(this.getPosition());

            });
        }

        for (var i = 0; i < stations.length; i++) {
            createMarker();
        }

        //Ici gérer le regroupement de marquers 
        var mcOptions = {
            gridSize: 70,
            maxZoom: 14,
            imagePath: 'images/m'
        };
        
        //Ici on fait appelle au fichier MarkerClusterer pour
        // l'agrégation des marqueurs en cluster 
        var mc = new MarkerClusterer(map, markers, mcOptions);

    });
};

// ------------------------------------------------------- //
// ------------------------ DOM SHOW --------------------- //
// ------------------------------------------------------- //
//Ici on anime le DOM. On affiche on masque certains éléments,
// on en crée certains

var mapElt = document.getElementById("map");
var infoBox = document.getElementById("infoBox");
var footer = document.getElementById("footer");
var legendBtn = document.getElementById("showLegend");
var legend = document.getElementById("lgdBlock");


var animDom = { //L'objet qui gère toutes les modifications, affichages, masquages des éléments du site

    showEtat: function () { //Ici l'affichage de l'infoBox
        
        // On commence par vider les anciennes données
        infoBox.innerHTML = "";
        infoBox.style.display = "block";

        mapElt.style.borderRadius = "30px 0px 0px 30px";

        var stationName = document.createElement("h3");
        var stationAddress = document.createElement("h4");
        var infoStatus = document.createElement("div");
        var infoBlock = document.createElement("div");
        var cancelButton = document.createElement("button");
        var reservButton = document.createElement("button");
        var confButton = document.createElement("button");
        var clearButton = document.createElement("button");

        //Remplissage de l'infoBox
        stationName.innerHTML = "Station n°" + etatStat.name;

        stationAddress.innerHTML = "Adresse : " + etatStat.address + ".";

        infoStatus.innerHTML = "<p>Etat de la station :</p><img src=" + etatStat.icon + "><p>" + etatStat.used + "</p>";

        infoBlock.innerHTML = "<p>Vélo(s) disponible(s) : " + etatStat.available_bikes + "</p><br/><p>Place(s) disponilble(s) : " + etatStat.available_bike_stands + "</p>";

        cancelButton.id = "close";
        cancelButton.textContent = "Réduire";

        infoBox.appendChild(stationName);
        infoBox.appendChild(stationAddress);
        infoBox.appendChild(infoStatus);
        infoBox.appendChild(infoBlock);

        infoBox.appendChild(cancelButton);

        //Ici on écoute l'événement sur le bouton d'annulation (renommer "Réduire"), qui appelera la fonction animDom.hideEtat()
        // et alert.hideCanvas() pour masquer l'infoBox et le Canvas
        cancelButton.addEventListener('click', function () {

            animDom.hideEtat();
            alert.hideCanvas();

        })

        //Affichage ou non du bouton de réservation suivant l'état de la station fermée / vide.
        if ((etatStat.status == "OPEN") && (etatStat.available_bikes !== 0)) {

            //Si le stockage n'est pas vide et que l'ID stocké correspond à l'idée du marker ciblé alors :
            if ((localStorage.getItem("station") == etatStat.name) && (localStorage.getItem("indice") == etatStat.indice)) {

                infoBlock.innerHTML = "<p><span>C'est ici que vous avez réservé un vélo.</span></p>";

            } else {

                reservButton.id = "reserv";
                reservButton.textContent = "Réserver";
                infoBox.appendChild(reservButton);

                reservButton.addEventListener('click', function () {

                    alert.showCanvas();

                    reservButton.style.display = "none";
                    clearButton.id = "clear";
                    clearButton.textContent = "Effacer votre signature.";
                    infoBox.appendChild(clearButton);

                    clearButton.addEventListener('click', function () {
                        alert.clearCanvas();
                        alert.showCanvas();
                    })

                    confButton.id = "conf";
                    confButton.textContent = "Confirmer";
                    infoBox.appendChild(confButton);
                    confButton.addEventListener('click', function () {

                        //Si le canvas est vide lorsque l'on appuie sur "confirmer"

                        if (alert.isCanvasBlank(canvasP)) {

                            alert.emptyCanvas();

                        } else if (localStorage.getItem("station") !== null) {

                            //S'il y a déjà une réservation en cours

                            footer.removeChild(cancelRes);
                            clearInterval(tempo);
                            localStorage.clear();
                            var signin = canvasP.toDataURL();
                            localStorage.setItem("signature", signin);
                            alert.hideCanvas();
                            etatStat.take();
                            clearButton.style.display = "none";

                        } else {

                            //S'il n'y a pas de réservation en cours

                            var signin = canvasP.toDataURL();
                            localStorage.setItem("signature", signin);
                            alert.hideCanvas();
                            etatStat.take();
                            clearButton.style.display = "none";

                        }

                    })

                })
            }
        } else {
            infoBox.removeChild(infoBlock);
        }
    },

    hideEtat: function () {
        infoBox.style.display = "none";
        mapElt.style.borderRadius = "30px 30px 30px 30px";
    },

    showFooter: function () {

        //Lorsque l'on valide un réservation le footer s'affiche avec les données mémorisées.

        var timeResa = document.getElementById("timeResa");
        var station = document.getElementById("station");
        var imageSign = document.getElementById("imageSign");
        var minutes = document.getElementById("minutes");

        //On ajoute un bouton d'annulation pour pouvoir annuler la résa
        var cancelRes = document.createElement("button");
        cancelRes.id = "cancelRes";
        cancelRes.style.display = "block";
        cancelRes.textContent = "Annulez votre réservation."
        footer.appendChild(cancelRes);

        imageSign.innerHTML = "<span>Votre signature :</span><img src=" + localStorage.getItem("signature") + " height=80% width=90%/>";
        station.textContent = (localStorage.getItem("station"));
        footer.style.display = "flex";

        cancelRes.addEventListener('click', function () {
            etatStat.remove();
            footer.removeChild(cancelRes);
            animDom.hideEtat();
            timer.clear();
        })

    },

    showLegend: function () {
        // Ici on affiche la légende de la carte
        legend.style.display = "flex";
        legendBtn.textContent = "Masquer la légende."
        legendBtn.addEventListener('click', function () {
            animDom.hideLegend();
        })
    },

    hideLegend: function () {
        // Ici on masque la légende de la carte
        legendBtn.textContent = "Appuyer pour voir la légende.";
        legend.style.display = "none";
        legendBtn.addEventListener('click', function () {
            animDom.showLegend();
        });
    }
};

legendBtn.addEventListener('click', function () {
    animDom.showLegend();
});

// ------------------------------------------------------- //
// ------------------- ALERTS & CANVAS ------------------- //
// ------------------------------------------------------- //
// Ici on gère les objets Alert, soit l'absence de signature, 
// l'affichage du canvas, le message de validation de 
// réservation ou d'expiration de la réservation, et les boutons mobiles

var canvasP = document.getElementById("canvas");
var context = canvas.getContext('2d');

var alert = {

    showCanvas: function () {
        //Ici on affiche le canvas avec les régles de signature au doigt ou a la souris

        if (!canvas) {
            alert("Impossible de récupérer le canvas");
            return;
        }

        if (!context) {
            alert("Impossible de récupérer le context du canvas");
            return;
        }

        canvasP.style.display = "block";

        alert.clearCanvas();

        //Fonction qui permet de signer dans le canvas à la souris
        canvasP.addEventListener('mousedown', function (e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            paint = true;
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            redraw();
        });
        
        //Fonction qui permet de signer sur une surface tactile
        canvasP.addEventListener('touchstart', function (e) {
            e.preventDefault();
            var mouseX = e.changedTouches[0].pageX - this.offsetLeft;
            var mouseY = e.changedTouches[0].pageY - this.offsetTop;
            paint = true;
            addClick(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop);
            redraw();
        })

        canvasP.addEventListener('mousemove', function (e) {

            if (paint) {
                addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
                redraw();
            }
        });

        canvasP.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (paint) {
                addClick(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop, true);
                redraw();
            }
        });

        canvasP.addEventListener('mouseup', function (e) {
            paint = false;
        });

        canvasP.addEventListener('touchend', function (e) {
            e.preventDefault();
            paint = false;
        });

        canvasP.addEventListener('mouseleave', function (e) {
            paint = false;
        });

        canvasP.addEventListener('touchleave', function (e) {
            e.preventDefault();
            paint = false;
        });

        var clickX = new Array();
        var clickY = new Array();
        var clickDrag = new Array();
        var paint;

        function addClick(x, y, dragging) {
            clickX.push(x);
            clickY.push(y);
            clickDrag.push(dragging);
        }

        function redraw() {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
            context.strokeStyle = "#333";
            context.lineJoin = "round";
            context.lineWidth = 4;
            for (var i = 0; i < clickX.length; i++) {
                context.beginPath();
                if (clickDrag[i] && i) {
                    context.moveTo(clickX[i - 1], clickY[i - 1]);
                } else {
                    context.moveTo(clickX[i] - 1, clickY[i]);
                }
                context.lineTo(clickX[i], clickY[i]);
                context.closePath();
                context.stroke();
            }
        }
    },

    hideCanvas: function () {
        alert.clearCanvas();
        canvasP.style.display = "none";
    },

    clearCanvas: function () {
        context.clearRect(0, 0, canvasP.width, canvasP.height);
    },

    isCanvasBlank: function (canvasP) {
        var blank = document.createElement('canvas');
        blank.width = canvasP.width;
        blank.height = canvasP.height;
        return canvasP.toDataURL() == blank.toDataURL();
    },

    emptyCanvas: function () {

        var emptyCanv = document.createElement("div");
        emptyCanv.className = "alert";
        emptyCanv.style.display = "block";
        emptyCanv.innerHTML = "<p>Vous devez signer <br/> pour pouvoir réserver votre vélo.</p>";
        var resa = document.getElementById("resa");
        resa.appendChild(emptyCanv);
        setTimeout(function () {
                emptyCanv.style.display = "none"
            },
            3000);
    },

    endResa: function () {
        var endResa = document.createElement("div");
        endResa.className = "alert";
        endResa.style.display = "block";
        endResa.innerHTML = "<h2>Votre réservation a expirée.</h2>";
        var resa = document.getElementById("resa");
        resa.appendChild(endResa);
        setTimeout(function () {
                endResa.style.display = "none"
            },
            6000);
    },
};

// ------------------------------------------------------- //
// ------------------- STATION DATA ---------------------- //
// ------------------------------------------------------- //
//Ici on manipule les données des stations, on enregistre la
// date de réservation et on vide les données

var etatStat = { //Ici on extrait les éléments du marquer cliqué receuillis dans l'API//

    init: function (status, name, address, available_bike_stands, available_bikes, used, icon, indice) {

        //Initialisation des infos
        this.status = status; //du status
        this.name = name; //du nom
        this.address = address; //de l'adresse
        this.available_bike_stands = available_bike_stands; //des espaces vélos disponibles
        this.available_bikes = available_bikes; // des vélos disponibles
        this.used = used; //l'état d'utilisation
        this.icon = icon; //l'image de la station
        this.indice = indice; //l'indice de la station
    },

    take: function () {
        var stati = this.name;
        var ID = this.indice;
        localStorage.setItem("station", stati);
        localStorage.setItem("indice", ID);
        animDom.showFooter();
        animDom.hideEtat();
        //On mémorise la date de réservation
        var startDate = new Date();
        startDate = new Date();
        var tempsDepart = startDate.getTime();
        //On calcule la date de fin de réservation
        var tempsFinResa = tempsDepart + 1200000;
        localStorage.setItem("finderesa", tempsFinResa);
        timer.show();
    },

    remove: function () {
        timer.clear();
        localStorage.clear();
    },
};

// ------------------------------------------------------- //
// ---------------------- TIMER -------------------------- //
// ------------------------------------------------------- //
// Ici on calcule le temps restant entre le temps de départ de
// la réservation et le temps final. On calcule en milliseconde
// et on converti en minutes/secondes.

var tempo;
var chrono;
var station = document.getElementById("station");
var minutes = document.getElementById("minutes");

var timer = {

    show: function () {
        tempo = setInterval(function () {
            var tempsActuel = new Date();
            var milliActuel = tempsActuel.getTime();
            var totaleMilliS = localStorage.finderesa - milliActuel;
            var totaleSec = totaleMilliS / 1000;
            var min = Math.floor(totaleSec / 60);
            var sec = Math.floor(totaleSec - min * 60);
            minutes.textContent = min + "min" + sec + "sec";
            
            if (totaleMilliS<=0){
                clearInterval(tempo);
                footer.removeChild(cancelRes);
                footer.style.display = "none";
                alert.endResa();
                localStorage.clear();
                minutes.textContent = "";
            }
        }, 1000);
        
    },

    clear: function () {
        clearInterval(tempo);
        localStorage.clear();
        footer.style.display = "none";
    },
};

// ------------------------------------------------------- //
// ----------------------  CARROUSEL --------------------- //
// ------------------------------------------------------- //
//Utilisation de la librairie JQuery pour la réalisation d'un carrousel
//Carrousel simple issu du W3C school.

$(document).ready(function () {
    var slideIndex = 1;
    var $slides = $(".mySlides");
    var $left = $("#left");
    var $right = $("#right");
    var $slideshow = $("#slideshow");
    var animCar = {
        plusSlides: function (n) {
            animCar.showSlides(slideIndex += n);
        },
        showSlides: function (n) {
            var i;
            if (n > $slides.length) {
                slideIndex = 1
            }
            if (n < 1) {
                slideIndex = $slides.length
            }
            for (i = 0; i < $slides.length; i++) {
                $slides.eq(i).hide();;
            }
            $slides.eq(slideIndex - 1).show();
        }
    };
    animCar.showSlides(slideIndex);
    //Ici le chevron gauche
    $left.click(function () {
        animCar.plusSlides(-1);
    });
    //Ici le chevron droit
    $right.click(function () {
        animCar.plusSlides(1);
    });

    //Ici on écoute les événements sur les flèches
    // gauches et droites du clavier
    $('body').keydown(function (e) {
        var appui = e.keyCode || e.wich;
        if (appui == 37) {
            animCar.plusSlides(-1);
        }
        if (appui == 39) {
            animCar.plusSlides(1);
        }
    });
});

// ------------------------------------------------------- //
// --------------------  MEMORY STATION ------------------ //
// ------------------------------------------------------- //
//Ici on regarde s'il y a une réservation de mémorisée 
// dans le localStorage. Si c'est le cas on extrait les données
// et on affiche le footer.

if (localStorage.getItem("station") !== null){
    animDom.showFooter();
    timer.show();
};