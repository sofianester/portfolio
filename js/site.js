/* Portfolio interactions: reveals, counters, nav state, pointer effects. No dependencies. */
(function () {
	'use strict';

	var root = document.documentElement;
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	// Hero entrance
	requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('loaded'); }); });

	// Theme toggle
	var themeBtns = document.querySelectorAll('[data-set-theme]');
	var metaTheme = document.getElementById('theme-color');
	function paintTheme(t) {
		root.setAttribute('data-theme', t);
		themeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-theme') === t)); });
		if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#ece6e8' : '#0f0e0f');
	}
	paintTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
	themeBtns.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var t = btn.getAttribute('data-set-theme');
			if (t === root.getAttribute('data-theme')) return;
			try { localStorage.setItem('theme', t); } catch (e) {}
			if (reduce) { paintTheme(t); return; }
			if (document.startViewTransition) {
				var r = btn.getBoundingClientRect();
				var x = r.left + r.width / 2, y = r.top + r.height / 2;
				root.style.setProperty('--tx', x + 'px');
				root.style.setProperty('--ty', y + 'px');
				root.style.setProperty('--tr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
				document.startViewTransition(function () { paintTheme(t); });
			} else {
				root.classList.add('theme-fade');
				paintTheme(t);
				setTimeout(function () { root.classList.remove('theme-fade'); }, 550);
			}
		});
	});
	try {
		window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
			var saved = null; try { saved = localStorage.getItem('theme'); } catch (err) {}
			if (!saved) paintTheme(e.matches ? 'light' : 'dark');
		});
	} catch (e) {}

	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	// Count-up
	function countUp(el) {
		var target = parseInt(el.getAttribute('data-count'), 10);
		var suffix = el.getAttribute('data-suffix') || '';
		var prefix = el.getAttribute('data-prefix') || '';
		if (reduce || !target) { el.textContent = prefix + target + suffix; return; }
		var start = null, dur = 1600;
		function step(t) {
			if (!start) start = t;
			var p = Math.min((t - start) / dur, 1);
			var eased = 1 - Math.pow(1 - p, 4);
			el.textContent = prefix + Math.round(target * eased) + suffix;
			if (p < 1) requestAnimationFrame(step);
		}
		el.textContent = prefix + '0' + suffix;
		requestAnimationFrame(step);
	}

	// Scroll reveal
	var revealEls = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && !reduce) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (!e.isIntersecting) return;
				e.target.classList.add('in');
				var num = e.target.querySelector('[data-count]');
				if (num) countUp(num);
				io.unobserve(e.target);
			});
		}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
		revealEls.forEach(function (el) { io.observe(el); });
	} else {
		revealEls.forEach(function (el) { el.classList.add('in'); });
	}

	// Scroll-driven: progress bar, nav state, timeline fill, active link
	var nav = document.querySelector('.nav');
	var timeline = document.querySelector('.timeline');
	var sections = ['work', 'experience', 'toolkit', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
	var links = {};
	document.querySelectorAll('.nav-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
	var lastY = window.scrollY, ticking = false;

	function onScroll() {
		var y = window.scrollY;
		var h = document.documentElement.scrollHeight - window.innerHeight;
		root.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);

		if (nav) {
			nav.classList.toggle('scrolled', y > 40);
			nav.classList.toggle('hide', y > 500 && y > lastY + 4);
			if (y < lastY - 4) nav.classList.remove('hide');
		}

		if (timeline) {
			var r = timeline.getBoundingClientRect();
			var vh = window.innerHeight;
			var p = (vh * 0.65 - r.top) / r.height;
			timeline.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
		}

		var current = null;
		sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s.id; });
		Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === current); });

		lastY = y;
		ticking = false;
	}
	window.addEventListener('scroll', function () {
		if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
	}, { passive: true });
	window.addEventListener('resize', onScroll);
	onScroll();
	if (reduce && timeline) timeline.style.setProperty('--tl', 1);

	if (reduce || !finePointer) return;

	// Spotlight that follows the pointer on cards
	document.querySelectorAll('.spot').forEach(function (el) {
		el.addEventListener('pointermove', function (e) {
			var r = el.getBoundingClientRect();
			el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
			el.style.setProperty('--my', (e.clientY - r.top) + 'px');
		});
	});

	// Portrait tilt + light
	var tilt = document.querySelector('.tilt');
	var hero = document.querySelector('.hero');
	if (tilt && hero) {
		hero.addEventListener('pointermove', function (e) {
			var r = tilt.getBoundingClientRect();
			var x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
			var y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
			tilt.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
			tilt.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
			tilt.style.setProperty('--gx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
			tilt.style.setProperty('--gy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
		});
		hero.addEventListener('pointerleave', function () {
			tilt.style.setProperty('--rx', '0deg');
			tilt.style.setProperty('--ry', '0deg');
		});
	}

	// Magnetic buttons
	document.querySelectorAll('.magnetic').forEach(function (btn) {
		btn.addEventListener('pointermove', function (e) {
			var r = btn.getBoundingClientRect();
			var x = e.clientX - (r.left + r.width / 2);
			var y = e.clientY - (r.top + r.height / 2);
			btn.style.transform = 'translate(' + (x * 0.25).toFixed(1) + 'px,' + (y * 0.35).toFixed(1) + 'px)';
		});
		btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
	});
})();
