// ── State ──────────────────────────────────────────────────────────────────
let galleryImages = [];
let galleryIndex  = 0;
let galleryPath   = [];
let isVideoMode   = false;

// ── Boot ───────────────────────────────────────────────────────────────────
fetch('data.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => buildTree(data))
  .catch(() => {
    document.getElementById('tree').innerHTML =
      '<p style="color:#B0AEA8;padding:8px 6px;font-size:12px;">' +
      'Lancez un serveur local pour prévisualiser (Live Server dans VS Code).' +
      '</p>';
  });


// ── Build tree ─────────────────────────────────────────────────────────────
function buildTree(data) {
  const header   = document.getElementById('tree-header');
  const treeView = document.getElementById('tree-view');
  const tree     = document.getElementById('tree');

  const rootRow      = makeRow('Anton Dethyre', 0, 'root');
  const rootChildren = makeContainer();

  rootRow.addEventListener('click', () => {
    if (rootChildren.classList.contains('open')) {
      tree.querySelectorAll('.tree-children.open').forEach(c => c.classList.remove('open'));
      tree.querySelectorAll('.arrow.open').forEach(a => a.classList.remove('open'));
      rootChildren.classList.remove('open');
      document.body.classList.remove('tree-expanded');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const headerLeft = header.getBoundingClientRect().left;
      treeView.style.paddingLeft = headerLeft + 'px';
      rootChildren.classList.add('open');
      document.body.classList.add('tree-expanded');
    }
  });

  const years = Object.keys(data.projets).sort((a, b) => b - a);
  years.forEach(year => {
    const [yearRow, yearEl] = togglable(makeRow(year, 1), makeContainer());
    data.projets[year].forEach(projet => buildProject(projet, year, yearEl));
    rootChildren.appendChild(yearRow);
    rootChildren.appendChild(yearEl);
  });

  buildInfos(data.infos, rootChildren);

  header.appendChild(rootRow);
  tree.appendChild(rootChildren);
}


function buildProject(projet, year, parent) {
  const inProgress = projet.statut === 'en-cours';
  const projectRow = makeRow(projet.titre, 2, inProgress ? 'in-progress' : '');
  const projectEl  = makeContainer();
  projectEl.classList.add('project-el');

  setupHover(projectRow, `images/${year}/${projet.slug}/cover.jpg`);

  // 1. texte
  if (projet.texte) {
    const [texteRow, texteEl] = togglable(makeRow('texte', 3), makeContainer());
    const block = document.createElement('div');
    block.className = 'inline-text';
    projet.texte.split('\n\n').forEach(p => {
      const el = document.createElement('p');
      el.textContent = p;
      block.appendChild(el);
    });
    texteEl.appendChild(block);
    projectEl.appendChild(texteRow);
    projectEl.appendChild(texteEl);
  }

  // 2. images
  if (projet.images && projet.images.length) {
    const imagesRow = makeRow('images', 3, 'action');
    imagesRow.addEventListener('click', e => {
      e.stopPropagation();
      openGallery(
        projet.images.map(f => `images/${year}/${projet.slug}/${f}`),
        ['Anton Dethyre', year, projet.titre, 'images']
      );
    });
    projectEl.appendChild(imagesRow);
  }

  // 3. vidéo
  if (projet.video) {
    const videoRow = makeRow('vidéo', 3, 'action');
    videoRow.addEventListener('click', e => {
      e.stopPropagation();
      openVideo(projet.video, ['Anton Dethyre', year, projet.titre, 'vidéo']);
    });
    projectEl.appendChild(videoRow);
  }

  // 4. édition
  if (projet.edition) {
    const [edRow, edEl] = togglable(makeRow('édition', 3), makeContainer());
    edEl.appendChild(makeRow(projet.edition, 4, 'muted'));
    projectEl.appendChild(edRow);
    projectEl.appendChild(edEl);
  }

  // 5. expo
  if (projet.expo && projet.expo.length) {
    const [expoRow, expoEl] = togglable(makeRow('expo', 3), makeContainer());

    projet.expo.forEach(expo => {
      const expoItemRow = makeRow(expo.titre, 4, 'action');
      setupHover(expoItemRow, `images/expo/${expo.slug}/affiche.jpg`);

      if (expo.images && expo.images.length) {
        expoItemRow.addEventListener('click', e => {
          e.stopPropagation();
          openGallery(
            expo.images.map(f => `images/expo/${expo.slug}/${f}`),
            ['Anton Dethyre', year, projet.titre, 'expo', expo.titre]
          );
        });
      }

      expoEl.appendChild(expoItemRow);
    });

    projectEl.appendChild(expoRow);
    projectEl.appendChild(expoEl);
  }

  togglable(projectRow, projectEl);
  parent.appendChild(projectRow);
  parent.appendChild(projectEl);
}


function buildInfos(infos, parent) {
  const [infosRow, infosEl] = togglable(makeRow('Infos', 1), makeContainer());

  // contact — bloc stylé comme inline-text
  const [contactRow, contactEl] = togglable(makeRow('contact', 2), makeContainer());
  const contactBlock = document.createElement('div');
  contactBlock.className = 'inline-contact';
  [infos.contact.email, infos.contact.ville]
    .filter(Boolean)
    .forEach(v => {
      const line = document.createElement('div');
      line.textContent = v;
      contactBlock.appendChild(line);
    });
  contactEl.appendChild(contactBlock);
  infosEl.appendChild(contactRow);
  infosEl.appendChild(contactEl);

  // commandes
  if (infos.commandes && infos.commandes.images && infos.commandes.images.length) {
    const [cmdRow, cmdEl] = togglable(makeRow('projets commerciaux', 2), makeContainer());
    setupHover(cmdRow, 'images/commandes/cover.jpg');
    const imgRow = makeRow('images', 3, 'action');
    imgRow.addEventListener('click', e => {
      e.stopPropagation();
      openGallery(
        infos.commandes.images.map(f => `images/commandes/${f}`),
        ['Anton Dethyre', 'Infos', 'commandes', 'images']
      );
    });
    cmdEl.appendChild(imgRow);
    infosEl.appendChild(cmdRow);
    infosEl.appendChild(cmdEl);
  }

  parent.appendChild(infosRow);
  parent.appendChild(infosEl);
}


// ── DOM helpers ────────────────────────────────────────────────────────────
function makeContainer() {
  const d = document.createElement('div');
  d.className = 'tree-children';
  return d;
}

function makeRow(label, depth, modifier) {
  const row = document.createElement('div');
  row.className = 'tree-row' + (modifier ? ` row-${modifier}` : '');

  for (let i = 0; i < depth; i++) {
    const s = document.createElement('span');
    s.className = 'indent';
    row.appendChild(s);
  }

  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  row.appendChild(arrow);

  const lbl = document.createElement('span');
  lbl.className = 'label';
  lbl.textContent = label;
  row.appendChild(lbl);

  return row;
}

function togglable(row, children) {
  row.querySelector('.arrow').textContent = '›';

  row.addEventListener('click', e => {
    e.stopPropagation();
    if (children.classList.contains('open')) {
      children.querySelectorAll('.tree-children.open').forEach(c => c.classList.remove('open'));
      children.querySelectorAll('.arrow.open').forEach(a => a.classList.remove('open'));
      children.classList.remove('open');
      row.querySelector('.arrow').classList.remove('open');
    } else {
      children.classList.add('open');
      row.querySelector('.arrow').classList.add('open');
    }
  });

  return [row, children];
}


// ── Hover preview ──────────────────────────────────────────────────────────
function setupHover(row, coverSrc) {
  const preview = document.getElementById('hover-preview');
  const img     = document.getElementById('preview-img');

  row.addEventListener('mouseenter', () => {
    img.src     = '';
    img.src     = coverSrc;
    img.onload  = () => { preview.style.display = 'block'; preview.classList.add('visible'); };
    img.onerror = () => { preview.style.display = 'none'; };
  });

  row.addEventListener('mousemove', e => {
    preview.style.left = (e.clientX - 48 - 400) + 'px';
    preview.style.top  = Math.max(8, e.clientY - 90) + 'px';
  });

  row.addEventListener('mouseleave', () => {
    preview.classList.remove('visible');
    preview.style.display = 'none';
    img.src = '';
  });
}


// ── Gallery ────────────────────────────────────────────────────────────────
function openGallery(images, path) {
  galleryImages = images;
  galleryIndex  = 0;
  galleryPath   = path;
  isVideoMode   = false;

  document.getElementById('gallery-img').style.display    = 'block';
  document.getElementById('gallery-iframe').style.display = 'none';
  document.getElementById('gallery-iframe').src           = '';

  document.getElementById('gallery').classList.remove('hidden');
  document.body.classList.add('gallery-open');
  renderGallery();
}

function openVideo(url, path) {
  let embedUrl = null;

  // Vimeo : vimeo.com/123456
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) embedUrl = `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`;

  // YouTube court : youtu.be/ID
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) embedUrl = `https://www.youtube-nocookie.com/embed/${ytShort[1]}?autoplay=1&rel=0`;

  // YouTube long : youtube.com/watch?v=ID
  const ytLong = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (ytLong) embedUrl = `https://www.youtube-nocookie.com/embed/${ytLong[1]}?autoplay=1&rel=0`;

  if (!embedUrl) return;

  galleryPath = path;
  isVideoMode = true;

  document.getElementById('gallery-img').style.display    = 'none';
  document.getElementById('gallery-iframe').src           = embedUrl;
  document.getElementById('gallery-iframe').style.display = 'block';

  document.getElementById('gallery').classList.remove('hidden');
  document.body.classList.add('gallery-open');
  renderBreadcrumb();
}

function renderGallery() {
  const img = document.getElementById('gallery-img');
  img.classList.add('loading');
  img.src    = galleryImages[galleryIndex];
  img.onload = () => img.classList.remove('loading');
  renderBreadcrumb();
}

function renderBreadcrumb() {
  const parts = [...galleryPath];
  if (!isVideoMode && galleryImages.length) {
    parts.push(galleryImages[galleryIndex].split('/').pop());
  }
  document.getElementById('breadcrumb').textContent = parts.join('  ›  ');
}

function closeGallery() {
  document.getElementById('gallery').classList.add('hidden');
  document.body.classList.remove('gallery-open');
  document.getElementById('gallery-img').src           = '';
  document.getElementById('gallery-iframe').src        = '';
  document.getElementById('gallery-iframe').style.display = 'none';
}

function goNext() {
  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  renderGallery();
}

function goPrev() {
  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  renderGallery();
}


// ── Events ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.getElementById('gallery').classList.contains('hidden')) return;
  if (e.key === 'Escape')                      closeGallery();
  if (!isVideoMode && e.key === 'ArrowRight')  goNext();
  if (!isVideoMode && e.key === 'ArrowLeft')   goPrev();
});

document.getElementById('gallery-close').addEventListener('click', closeGallery);

const galContainer = document.getElementById('gallery-container');

galContainer.addEventListener('click', e => {
  if (isVideoMode) return;
  const { left, width } = e.currentTarget.getBoundingClientRect();
  e.clientX < left + width / 2 ? goPrev() : goNext();
});

galContainer.addEventListener('mousemove', e => {
  if (isVideoMode) return;
  const { left, width } = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.cursor = e.clientX < left + width / 2 ? 'w-resize' : 'e-resize';
});
