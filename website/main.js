// Page Elements

var doc = $(document);
var colorizer;

var map;

var panel;
var scrollElements;

var bottom;
var bottomText;

var topButtons;

var allFilter;
var degreeSelection;

// Filters

var countryFilter = 'All';
var degreeFilter = 'All';
var domainFilter = 'All';

// Degree domains

var domains = loadDegreeDomains ();

// Other

// Maps a country name to its code
var codeMapping = loadCountryCodeMapping ();

// The actual leaderboard matching filters

var leaderboard = getRankedUniversities ();

// Used to trigger leaderboard renewing when the filters have been changed
var leaderboardDirty = true;

// False if we're on the map
var currentState = false;

// Switch used to prevent the bottom part to be triggered when the pointer is coming from outside the window
var fromOutside = false;

// The max rank considering the filters, e.g. the number of ranked universities
var maxRank = 0;

// The first rank showing in the window, used for scrolling purposes
var currentScroll = 0;

// True if we are current choosing filter and we just decided on the degree
var degreeChosen = false;

// True if a transition is currently playing
var transitioning = false;

// True if the leaderboard is shown
var leaderboardShown = false;

doc.ready (function (e) {

	// Linking all page elements
	
	colorizer = $('#colorizer');
	
	map = $('#map');
	
	panel = $('#panel');
	scrollElements = $('.scrollElement');
	
	bottom = $('#bottom');
	bottomText = $('#bottomText');
	
	topButtons = $('#topButtons');
	
	allFilter = $('#allFilter');
	degreeSelection = $('#degreeSelection');
	
	// Creating the world map
	
	map.vectorMap ({

		map: 'world_mill',
		backgroundColor: '#000033',
		zoomOnScrollSpeed: 1,
		regionsSelectable: true,
		
		// Colors of the map countries
		
		regionStyle: {
			
			initial: {
				
				fill: '#225599',
				
			},
			
			selected: {
				
				fill: '#5555ff'
				
			},
			
		},
		
		// Labels diplayed on the pins, e.g. the rank of the pinned university
		
		labels: {

            markers: {
				
				// Displays its rank
				
                render: function (code) {
                    return parseInt (code) + 1;
                },
				
				// Offsets so that the rank is centered inside the dot shape
				
				offsets: function(code){
					
					switch (code) {
						
					case '0':
						return [-28, 0];
						
					case '1':
						return [-24, 0];
						
					case '2':
						return [-20, 0];
						
					default:
						return [-18, 0];
						
					}
					
				}
				
            }

        },
		
		// Changing the font for the rank label
		
		markerLabelStyle: {
			
			initial: {
				
				'font-family': 'Roboto'
				
			}
			
		},
		
		// Callback when selecting a country to create the new filter
		
		onRegionSelected: function (e, code, isSelected, selectedRegions) {
			
			// If no country is selected, we set the filter to 'All'.
			// Otherwise, as selected regions are provided in ISO form, we need to get the real country name using the map.
			
			if (selectedRegions == null || selectedRegions.length == 0)
				countryFilter = 'All';
			else {
			
				countryFilter = '';
				var mapConverter = map.vectorMap ('get', 'mapObject');
				
				// countryFilter now holds each selected countries, separated by commas
				
				for (i = 0; i < selectedRegions.length; i++) {
					
					if (i == selectedRegions.length - 1)
						countryFilter += mapConverter.getRegionName (selectedRegions [i]);
					else
						countryFilter += mapConverter.getRegionName (selectedRegions [i]) + ',';
					
				}
				
			}
			
			// Filter has changed : we update the leaderboard
			
			leaderboardDirty = true;
			leaderboard = getRankedUniversities ();
			
		}

	});
	
	// Trigger for when the user puts his mouse over the botton part, the panel with little arrows pointing down
	// It switches between the map and the panel where the rankings and filters are
	
	bottom.hover (function (e) {
		
		// Avoid when it is being pulled down (transition to filter selection)
		
		if (bottom.attr ('class') == 'swipeDown')
			return;
		
		// Delaying 10ms ? I can't remember why... But there was a valid reason that cost me an hour or two...
		
		setTimeout (function () {
			
			// Prevent triggering when the cursor comes from outside the window
			// Otherwise, just switch the state
			
			if (fromOutside)
				fromOutside = false;
			else
				switchState ();
		
		}, 10);
		
	}, function () {});
	
	// Oh I remember now, this was the best solution I came up with, because detecting when the cursor leaves the window was not possible
	// So when the cursor ENTERS the window, we assume it was outside, hence we set 'fromOutside' to true for a short period of time, just
	// necessary for the bottom.hover function to cancel.
	
	doc.hover (function () {
		
		fromOutside = true;
		
		setTimeout (function () {
			
			fromOutside = false;
			
		}, 20);
		
	}, function () {});
	
	// Trigger for when scrolling the leaderboard, it should scroll the values
	
	panel.bind ('mousewheel', function (e) {
		
		// Grab mousewheel data
		
		var w = e.originalEvent.wheelDelta / 120;
		
		// No scrolling should cancel
		
		if (w == 0)
			return;
		
		// We basically just increase/decrease the value of the first rank to be displayed, then refresh the leaserboard accordingly.
		
		if (w > 0) {
			
			if (currentScroll == 0)
				return;
			
			currentScroll -= 1;
			
		} else {
			
			// 10 entries are shown in the window
			
			if (degreeChosen) {
				
				if (currentScroll == maxRank - 9)
					return;
				
			} else if (currentScroll == maxRank - 10)
				return;
			
			currentScroll += 1;
			
		}
	
		refreshLeaderboardEntries ();
		
	});

	// When loading page, open about modale window which explains the project in a couple of sentances

	// switchState()
	var inst = $('[data-remodal-id=modal]').remodal();
	inst.open();
	
});

// Switches from map to leaderboard and back on

function switchState () {
			
	if (currentState) {
		
		if (leaderboardDirty)
			leaderboard = getRankedUniversities ();
		
		currentState = false;
		
		panel.css ('pointer-events', 'none');
		bottomText.html ('Rankings');
		
		map.attr ('class', 'blurOut'); 
		panel.attr ('class', 'panelBlurIn');
		colorizer.attr ('class', 'hueRed2Blue');
		
	} else {
		
		currentState = true;
		
		// This is when we actually renew the leaderboard when the country filter has changed
		
		if (leaderboardDirty) {
			
			leaderboardDirty = false;
			renewLeaderboard ();
			
		}
		
		panel.css ('pointer-events', 'auto');
		bottomText.html ('Map');
			
		map.attr ('class', 'blurIn');
		panel.attr ('class', 'panelBlurOut');
		colorizer.attr ('class', 'hueBlue2Red');
		
	}
	
}

// Prints the current view of the leaderboard, according to scrolling position and filters

function refreshLeaderboardEntries () {
	
	if (degreeChosen == true) {
	
		scrollElements.each (function (index) {
			
			if (index == 0)
				return;
			
			var currentIndex = index - 1 + currentScroll;
			fillScrollElement ($(this), domains [currentIndex]);
			
		});
	
	} else {
	
		scrollElements.each (function (index) {
			
			var currentIndex = index + currentScroll;
			
			if (currentIndex < maxRank) {
				
				var entry = leaderboard [currentIndex];
				fillScrollElement ($(this), entry.name, entry.rank, entry.country);
			
			} else
				$(this).html ('');
			
		});
		
	}
	
}

// Function triggered upon filter tweaking, it will swipe the leaderboard out and swipe a new one in, matching the filters
// I won't go much into details because it's not that interesting

function renewLeaderboard () {
	
	currentScroll = 0;
	
	var delay = 200;
	
	if (maxRank > 0)
		delay = 600;
	
	SlideLeaderboard (false, getNewLeaderboard);
	
}

// Callback for the "swipe left" animation, where we finish updating the leaderboard

function getNewLeaderboard () {
	
	maxRank = leaderboard.length;
	refreshLeaderboardEntries ();
	SlideLeaderboard (true);
	
}

// Slides the leaderboard tiles in or out, with a callback to be executed when the animation finished if needed

function SlideLeaderboard (slideIn, callback = null) {
	
	if (slideIn == leaderboardShown) {
		
		callback ();
		return;
		
	}
	
	if (slideIn)
		leaderboardShown = true;
	else {
		
		leaderboardShown = false;
		topButtons.attr ('class', 'swipeUp');
		
	}

	scrollElements.each (function (index) {
		
		if (index >= maxRank)
			return;
		
		var s = $(this);
		
		setTimeout (function () {
				
			if (slideIn)
				s.attr ('class', 'scrollElement swipeRight');
			else
				s.attr ('class', 'scrollElement swipeLeft');
			
			if (index == Math.min (maxRank, 10) - 1) {
				
				setTimeout (function () {
					
					if (slideIn)
						topButtons.attr ('class', 'swipeDown');
					
					if (callback != null)
						callback ();
					
				}, 500);
				
			}
			
		}, index * 100 + 200);
		
	});
	
}

// Initiates transition to filter selection panel

function startFilter () {
	
	degreeChosen = false;
	bottom.attr ('class', 'swipeDown');
	SlideLeaderboard (false, showFilterPanel);
	
}

// Terminates transition to filter selection panel

function showFilterPanel () {
	
	colorizer.attr ('class', 'hueRed2Green');
	
	allFilter.css ('pointer-events', 'auto');
	allFilter.attr ('class', 'filterButton panelBlurOut');
	
	setTimeout (function () {
		
		degreeSelection.attr ('class', 'scaleUp');
		
	}, 500);
	
}

// Called when pressing the 'All' button

function chooseFilterAll () {
	
	if (transitioning)
		return;
	
	if (degreeChosen) {
		
		degreeChosen = false;
		domainFilter = 'All';
		filterComplete ();
	
	} else {
		
		degreeChosen = true;
		degreeFilter = 'All';
		switchToFilterDomain ();
		
	}
	
}

// Called when selecting the degree

function chooseFilterDegree (degree) {
	
	if (transitioning)
		return;
	
	degreeChosen = true;
	degreeFilter = degree;
	switchToFilterDomain ();
	
}

// Called when selecting the domain

function chooseFilterDomain (domain) {
	
	if (transitioning)
		return;
	
	degreeChosen = false;
	domainFilter = domain;
	filterComplete ();
	
}

// Transition between degree selection and domain selection

function switchToFilterDomain () {
	
	currentScroll = 0;
	transitioning = true;
		
	degreeSelection.attr ('class', 'scaleDown');
	
	setTimeout (function () {
		
		refreshLeaderboardEntries ();
		maxRank = domains.length;
		allFilter.attr ('class', 'filterButton toDomain');
		
		setTimeout (function () {
			
			scrollElements.each (function (index) {
			
				if (index > 0) {
					
					var s = $(this);
					
					setTimeout (function () {
						
						s.attr ('class', 'scrollElement scaleIn');
						
						if (index == 9)
							transitioning = false;
						
					}, 100 * index);
					
				}
			
			});
			
		}, 500);
		
	}, 300);
	
}

// Filter completed : transition back to the map

function filterComplete () {
	
	allFilter.css ('pointer-events', 'none');
	leaderboardDirty = true;
	transitioning = true;
	
	scrollElements.each (function (index) {
			
		if (index > 0) {
			
			var s = $(this);
			
			setTimeout (function () {
				
				s.attr ('class', 'scrollElement scaleOut');
				
			}, 100 * (9 - index));
			
		}
	
	});
			
	setTimeout (function () {
		
		allFilter.attr ('class', 'filterButton fromDomain');
		
	}, 900);
			
	setTimeout (function () {
		
		bottom.attr ('class', 'swipeUp');
		switchState ();
		transitioning = false;
		
	}, 1200);
	
}

// Fills a scroll element (leaderboard or domain filter selection)

function fillScrollElement (scrollElement, content, rank = -1, country = '') {
	
	if (rank < 1)
		scrollElement.html (content);
	else {
		
		if (country == '')
			scrollElement.html ('<div class="universityRank"><div class="universityFlag"></div>' + rank + '</div><div class="universityName">' + content + '</div>');
		else
			scrollElement.html ('<div class="universityRank"><div class="universityFlag" style="background-image: url(\'flags/' + codeMapping [country].toLowerCase () + '.png\');"></div>' + rank + '</div><div class="universityName">' + content + '</div>');
	
	}
	
}

// Which leaderboard university did we just press ? Useful to access university's website

function clickedElement (i) {
	
	if (transitioning)
		return;
	
	if (degreeChosen)
		chooseFilterDomain (domains [i - 1 + currentScroll]);
	else {
		
		var win = window.open ('http://' + leaderboard [i + currentScroll].website, '_blank');
		win.focus();
		
	}
	
}

// Creates a map between country name and ISO code

function loadCountryCodeMapping () {
	
	var countries = 'Bangladesh,Belgium,Burkina Faso,Bulgaria,Bosnia and Herz.,Brunei,Bolivia,Japan,Burundi,Benin,Bhutan,Jamaica,Botswana,Brazil,Bahamas,Belarus,Belize,Russia,Rwanda,Serbia,Timor-Leste,Turkmenistan,Tajikistan,Romania,Guinea-Bissau,Guatemala,Greece,Eq. Guinea,Guyana,Georgia,United Kingdom,Gabon,Guinea,Gambia,Greenland,Ghana,Oman,Tunisia,Jordan,Croatia,Haiti,Hungary,Honduras,Puerto Rico,Palestine,Portugal,Paraguay,Panama,Papua New Guinea,Peru,Pakistan,Philippines,Poland,Zambia,W. Sahara,Estonia,Egypt,South Africa,Ecuador,Italy,Vietnam,Solomon Is.,Ethiopia,Somalia,Zimbabwe,Spain,Eritrea,Montenegro,Moldova,Madagascar,Morocco,Uzbekistan,Myanmar,Mali,Mongolia,Macedonia,Malawi,Mauritania,Uganda,Malaysia,Mexico,Israel,France,Somaliland,Finland,Fiji,Falkland Is.,Nicaragua,Netherlands,Norway,Namibia,Vanuatu,New Caledonia,Niger,Nigeria,New Zealand,Nepal,Kosovo,Cote d\'Ivoire,Switzerland,Colombia,China,Cameroon,Chile,N. Cyprus,Canada,Congo,Central African Rep.,Dem. Rep. Congo,Czech Rep.,Cyprus,Costa Rica,Cuba,Swaziland,Syria,Kyrgyzstan,Kenya,S. Sudan,Suriname,Cambodia,El Salvador,Slovakia,Korea,Slovenia,Dem. Rep. Korea,Kuwait,Senegal,Sierra Leone,Kazakhstan,Saudi Arabia,Sweden,Sudan,Dominican Rep.,Djibouti,Denmark,Germany,Yemen,Algeria,United States,Uruguay,Lebanon,Lao PDR,Taiwan,Trinidad and Tobago,Turkey,Sri Lanka,Latvia,Lithuania,Luxembourg,Liberia,Lesotho,Thailand,Fr. S. Antarctic Lands,Togo,Chad,Libya,United Arab Emirates,Venezuela,Afghanistan,Iraq,Iceland,Iran,Armenia,Albania,Angola,Argentina,Australia,Austria,India,Tanzania,Azerbaijan,Ireland,Indonesia,Ukraine,Qatar,Mozambique'.split (',');
	var codes = 'BD,BE,BF,BG,BA,BN,BO,JP,BI,BJ,BT,JM,BW,BR,BS,BY,BZ,RU,RW,RS,TL,TM,TJ,RO,GW,GT,GR,GQ,GY,GE,GB,GA,GN,GM,GL,GH,OM,TN,JO,HR,HT,HU,HN,PR,PS,PT,PY,PA,PG,PE,PK,PH,PL,ZM,EH,EE,EG,ZA,EC,IT,VN,SB,ET,SO,ZW,ES,ER,ME,MD,MG,MA,UZ,MM,ML,MN,MK,MW,MR,UG,MY,MX,IL,FR,XS,FI,FJ,FK,NI,NL,NO,NA,VU,NC,NE,NG,NZ,NP,XK,CI,CH,CO,CN,CM,CL,XC,CA,CG,CF,CD,CZ,CY,CR,CU,SZ,SY,KG,KE,SS,SR,KH,SV,SK,KR,SI,KP,KW,SN,SL,KZ,SA,SE,SD,DO,DJ,DK,DE,YE,DZ,US,UY,LB,LA,TW,TT,TR,LK,LV,LT,LU,LR,LS,TH,TF,TG,TD,LY,AE,VE,AF,IQ,IS,IR,AM,AL,AO,AR,AU,AT,IN,TZ,AZ,IE,ID,UA,QA,MZ'.split (',');
	
	var output = {};
	
	for (i = 0; i < countries.length; i++)
		output [countries [i]] = codes [i];
	
	return output;
	
}

// Creates an array containing all domain filters

function loadDegreeDomains () {
	
	return 'Academic Studies In Education,Accounting,Adult Nursing,Applied Mathematics,Aquatic Sciences,Archaeology,Art History,Arts & Humanities,Astronomy & Planetary Science,Biochemistry,Biology,Business & Commercial Law,Business & Management,Business Studies,Chemistry,Childhood & Youth Studies,Children, Young People & Families,Chinese,Classical Studies,Communication Technologies,Computing & IT,Counselling,Creative Writing,Criminology,Design,Development,Early Years,Earth Sciences,Ecology,Economics,Education, Childhood & Youth,Electronic Engineering,Engineering,English Language,English Literature,Environment & Development,Environmental Management,Environmental Sciences,Environmental Studies,Finance,French,General Computing,General Design,General Education,General Engineering,General Humanities,General Law,General Mathematics,General Nursing,General Social Science,General Statistics,General Technology,Genetics,Geography,Geology,German,Graphic Design,Health & Social Care,Health & Wellbeing,Health Sciences,Healthcare Practice,Heritage,History,Human Anatomy,Human Computer Interaction,Humanities,International Studies,Italian,Languages,Law,Leadership & Management,Linguistics,Management,Marketing,Mathematical Methods,Mathematics,Mathematics & Statistics,Medical Sciences,Mental Health Nursing,Music,Natural Sciences,Networking,Neuroscience,Nursing & Healthcare Practice,Pathology,Philosophy,Physics,Politics,Primary Education,Professional Science,Project Management,Psychology,Psychology & Counselling,Pure Mathematics,Religious Studies,Research & Study Skills In Education,Retail Management,Science,Secondary Education,Social Care,Social Policy,Social Sciences,Social Work,Sociology,Software Engineering,Spanish,Sport & Fitness,Statistics,Strategic Management,Teacher Training,Technology,UK Law,Youth Studies'.split (',');
	
}

// Refreshes the map and updates the pinned universities

function refreshMapPins () {
	
	var mapObject = map.vectorMap ('get', 'mapObject');
	mapObject.removeAllMarkers ();
			
	for (i = leaderboard.length - 1; i > -1; i--) {
	
		var entry = leaderboard [i];
		mapObject.addMarker (i, {name: entry.name, latLng: [entry.lat, entry.lng], style: {
		
			fill: (i == 0 ? '#ffcc00' : (i == 1 ? '#999999' : (i == 2 ? '#996600' : '#5599ff'))),
			r: (i == 0 ? 20 : (i == 1 ? 16 : (i == 2 ? 12 : 10)))
			
		}});
	
	}
		
	mapObject.applyTransform ();
	
}

// Generates the ranked university list. See the right format.

function getRankedUniversities () {
	
	// This function should compute the list using the three static filters 'countryFilter', 'degreeFilter' and 'domainFilter'
	// Countries are separated by a comma

	var l=[];

	// Load and aggregate data depending on filters
	d3.csv('data/data.csv', function(csv_data){

		// Filter on country, degree or domain
		var filtered_data = csv_data;
        if (countryFilter != 'All') {
            filtered_data = filtered_data.filter(function (d) {
                return countryFilter.indexOf(d.Country) != -1;
            });
        }
        if (degreeFilter != 'All') {
            filtered_data = filtered_data.filter(function (d) {
                return d.degree_type == degreeFilter.toLowerCase();
            });
        }

		if (domainFilter != 'All'){
			filtered_data = filtered_data.filter(function (d) {
				return d.subject == domainFilter.toLowerCase();
			});
		}

		// Groupo data by university and sum up the rankings
		var data = d3
			.nest()
			.key(function(entry){return entry.University;})
			.rollup(function(entries){
				return {"rank": d3.sum(entries, function(g){return g.weighted_inv_rank;}),
						"country": entries[0].Country,
						"website": entries[0].domain,
						"lat": entries[0].lat,
						"lng": entries[0].lng
				};
			}).entries(filtered_data);
			data.sort(function(a,b){return a.value.rank - b.value.rank});
			data.reverse();
			// console.log(data);
            // Build ranking to return to leaderboard
			var step;
			for (step=1; step<data.length; step++){
				obj = {
					name: data[step-1].key,
					rank: step,
					country: data[step-1].value.country,
					website: data[step-1].value.website,
					lat: data[step-1].value.lat,
					lng: data[step-1].value.lng
				};
				l.push(obj);
			}
	});
	
	setTimeout (function () {
		refreshMapPins ();
	}, 100);
	
	return l;
	
}