
'use strict';

// NASA Space Explorer — Project 7
// Official NASA Science APOD API.
// No personal API key is required for this endpoint.
const API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const MAX_DAYS = 30;

// Existing date inputs and validation from dateRange.js
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

setupDateInputs(startInput, endInput);

// App elements
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('fetchImages');
const statusMessage = document.getElementById('statusMessage');
const spaceFact = document.getElementById('spaceFact');

// Modal elements
const modal = document.getElementById('imageModal');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalImage = document.getElementById('modalImage');
const modalExplanation = document.getElementById('modalExplanation');
const modalVideo = document.getElementById('modalVideo');
const closeModalButton = document.getElementById('closeModal');

let lastFocusedElement = null;
let activeRequest = null;

// Bonus LevelUp: Random space facts
const spaceFacts = [
  'One day on Venus is longer than one year on Venus.',
  'Sunlight takes about 8 minutes and 20 seconds to reach Earth.',
  'Jupiter is the largest planet in our solar system.',
  'Neptune takes about 165 Earth years to orbit the Sun.',
  'The Moon is slowly moving away from Earth.',
  'Saturn has an average density lower than water.',
  'Mars has the tallest known volcano in the solar system: Olympus Mons.',
  'The Milky Way contains billions of stars.',
  'A day on Jupiter lasts approximately 10 hours.',
  'The footprints left on the Moon can remain for millions of years.'
];

function displayRandomFact() {
  if (!spaceFact) return;

  const randomIndex = Math.floor(Math.random() * spaceFacts.length);

  // The HTML already contains the "Did You Know?" heading.
  spaceFact.textContent = spaceFacts[randomIndex];
}

// Format a NASA date
function formatDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');

  if (Number.isNaN(date.getTime())) {
    return dateString || 'Unknown date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Show status messages
function showStatus(message, type = 'info') {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusMessage.hidden = !message;
}

// Validate selected dates
function validateDates() {
  const start = startInput.value;
  const end = endInput.value;

  if (!start || !end) {
    throw new Error(
      'Please select both a start date and an end date.'
    );
  }

  const startTime = Date.parse(start + 'T00:00:00Z');
  const endTime = Date.parse(end + 'T00:00:00Z');

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime)
  ) {
    throw new Error('Please enter a valid date range.');
  }

  if (start < earliestDate || end > today) {
    throw new Error(
      'Please select dates between June 16, 1995 and today.'
    );
  }

  if (start > end) {
    throw new Error(
      'The start date must be before the end date.'
    );
  }

  const totalDays =
    Math.round((endTime - startTime) / 86400000) + 1;

  if (totalDays < 1 || totalDays > MAX_DAYS) {
    throw new Error(
      'Please choose a range of 30 days or fewer.'
    );
  }

  return { start, end };
}

// Convert YYYY-MM-DD into NASA's YYMMDD format
function toNASAQueryDate(dateString) {
  return dateString.slice(2).replace(/-/g, '');
}

// Safely create an element with text
function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = text;
  }

  return element;
}

// Convert HTML explanations into plain text safely
function cleanExplanation(value) {
  if (!value) {
    return 'No explanation is available.';
  }

  const html =
    typeof value === 'string'
      ? value
      : typeof value.rendered === 'string'
        ? value.rendered
        : '';

  if (!html) {
    return 'No explanation is available.';
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(
    html,
    'text/html'
  );

  // Remove non-explanation content.
  documentFragment
    .querySelectorAll('script, style, iframe')
    .forEach(element => element.remove());

  return documentFragment.body.textContent.trim() ||
    'No explanation is available.';
}

// Accept only usable HTTP(S) URLs
function safeURL(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  try {
    const parsed = new URL(value);

    if (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:'
    ) {
      return parsed.href;
    }
  } catch (error) {
    return '';
  }

  return '';
}

// Normalize the new NASA API response
function normalizeAPOD(item) {
  const mediaType = item.media_type;

  const imageURL = safeURL(
    item.hdurl ||
    item.thumbnail_url ||
    item.thumbnail ||
    (mediaType === 'image' ? item.url : '')
  );

  // The new API can use "url" for the APOD article,
  // rather than the actual photograph or video.
  const videoURL = safeURL(
    item.video_url ||
    item.videoUrl ||
    item.embed_url ||
    item.embedUrl ||
    ''
  );

  const articleURL = safeURL(item.url || item.link || '');

  return {
    date: item.date,
    title: item.title || 'NASA Astronomy Picture',
    media_type: mediaType,
    url: mediaType === 'image' ? imageURL : videoURL,
    hdurl: imageURL,
    thumbnail: imageURL,
    articleURL,
    explanation: cleanExplanation(
      item.explanation || item.content
    )
  };
}

// Bonus LevelUp: Handle both images and videos
function createGalleryCard(item) {
  const card = createElement('button', 'space-card');
  card.type = 'button';

  card.setAttribute(
    'aria-label',
    'View details: ' + item.title
  );

  const mediaWrapper = createElement('div', 'card-media');

  const imageURL =
    item.media_type === 'image'
      ? item.url
      : item.thumbnail;

  if (imageURL) {
    const image = document.createElement('img');

    image.src = imageURL;
    image.alt = item.title || 'NASA astronomy image';
    image.loading = 'lazy';

    mediaWrapper.appendChild(image);
  } else {
    mediaWrapper.appendChild(
      createElement(
        'div',
        'video-placeholder',
        item.media_type === 'video'
          ? '▶ NASA Space Video'
          : 'NASA Astronomy Picture'
      )
    );
  }

  const cardContent = createElement('div', 'card-content');

  cardContent.appendChild(
    createElement('h2', 'card-title', item.title)
  );

  cardContent.appendChild(
    createElement(
      'p',
      'card-date',
      formatDate(item.date)
    )
  );

  if (item.media_type === 'video') {
    cardContent.appendChild(
      createElement('span', 'video-label', 'Video')
    );
  }

  card.append(mediaWrapper, cardContent);

  card.addEventListener('click', () => {
    openModal(item);
  });

  return card;
}

// Populate gallery using live NASA data
function displayGallery(items) {
  gallery.replaceChildren();

  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    fragment.appendChild(createGalleryCard(item));
  });

  gallery.appendChild(fragment);
}

// Accessible image/video modal
function openModal(item) {
  if (!modal) return;

  lastFocusedElement = document.activeElement;

  modalTitle.textContent =
    item.title || 'NASA Astronomy Picture';

  modalDate.textContent = formatDate(item.date);

  modalExplanation.textContent =
    item.explanation || 'No explanation is available.';

  modalImage.hidden = true;
  modalImage.removeAttribute('src');

  modalVideo.hidden = true;
  modalVideo.replaceChildren();

  if (item.media_type === 'image' && item.url) {
    modalImage.src = item.hdurl || item.url;
    modalImage.alt =
      item.title || 'NASA astronomy image';

    modalImage.hidden = false;
  } else if (item.media_type === 'video') {
    const videoLink = document.createElement('a');

    // Prefer an actual video URL. If NASA provides only
    // the article link, open the official APOD page.
    videoLink.href =
      item.url || item.articleURL ||
      'https://science.nasa.gov/';

    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';

    videoLink.textContent = item.url
      ? 'Watch this NASA space video'
      : 'View this video on NASA Science';

    modalVideo.appendChild(videoLink);
    modalVideo.hidden = false;
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');

  if (closeModalButton) {
    closeModalButton.focus();
  }
}

function closeModal() {
  if (!modal || modal.hidden) return;

  modal.hidden = true;

  document.body.classList.remove('modal-open');

  modalImage.removeAttribute('src');
  modalVideo.replaceChildren();

  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus === 'function'
  ) {
    lastFocusedElement.focus();
  }
}

// Fetch APOD entries from NASA's new API
async function fetchSpaceImages() {
  let dates;

  try {
    dates = validateDates();
  } catch (error) {
    showStatus(error.message, 'error');
    return;
  }

  // Cancel a previous request if necessary.
  if (activeRequest) {
    activeRequest.abort();
  }

  const controller = new AbortController();
  activeRequest = controller;

  fetchButton.disabled = true;
  gallery.replaceChildren();

  showStatus('Loading space photos...', 'loading');

  try {
    const params = new URLSearchParams({
      date_from: toNASAQueryDate(dates.start),
      date_to: toNASAQueryDate(dates.end),
      per_page: String(MAX_DAYS)
    });

    const response = await fetch(
      API_URL + '?' + params.toString(),
      { signal: controller.signal }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          'NASA is receiving too many requests. Please try again later.'
        );
      }

      throw new Error(
        'NASA could not load the images. HTTP ' +
        response.status
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        'NASA returned an unexpected response.'
      );
    }

    // Keep valid entries within the selected date range.
    const entries = data
      .filter(item =>
        item &&
        typeof item.date === 'string' &&
        item.date >= dates.start &&
        item.date <= dates.end &&
        item.title &&
        (
          item.media_type === 'image' ||
          item.media_type === 'video'
        )
      )
      .map(normalizeAPOD)
      .filter(item =>
        item.media_type === 'video' ||
        Boolean(item.url)
      );

    if (entries.length === 0) {
      showStatus(
        'No space images were found for this date range.'
      );
      return;
    }

    // Display entries from oldest to newest.
    entries.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    displayGallery(entries);

    showStatus('');

  } catch (error) {
    if (error.name !== 'AbortError') {
      showStatus(
        error.message ||
        'Something went wrong while loading NASA data.',
        'error'
      );
    }
  } finally {
    if (activeRequest === controller) {
      activeRequest = null;
      fetchButton.disabled = false;
    }
  }
}

// Events
if (fetchButton) {
  fetchButton.addEventListener(
    'click',
    fetchSpaceImages
  );
}

if (closeModalButton) {
  closeModalButton.addEventListener(
    'click',
    closeModal
  );
}

if (modal) {
  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('keydown', event => {
  if (!modal || modal.hidden) return;

  if (event.key === 'Escape') {
    closeModal();
    return;
  }

  // Keep keyboard focus inside the open modal.
  if (event.key === 'Tab') {
    const focusable = Array.from(
      modal.querySelectorAll('button, a[href]')
    ).filter(element =>
      !element.hidden &&
      element.getClientRects().length > 0
    );

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Initialize
displayRandomFact();
fetchSpaceImages();
