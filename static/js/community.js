let allPosts = [];
let currentPostId = null;

window.addEventListener('DOMContentLoaded', loadPosts);

async function loadPosts() {
  try {
    const res = await fetch('/api/forum');
    const data = await res.json();
    allPosts = data.posts || [];
    renderPosts(allPosts);
  } catch (e) {
    document.getElementById('forumPosts').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">Could not load posts.</p>';
  }
}

function renderPosts(posts) {
  const container = document.getElementById('forumPosts');
  if (posts.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">No posts yet. Be the first to post!</p>';
    return;
  }
  container.innerHTML = posts.map(p => `
    <div class="forum-post" onclick="viewPost(${p.id})">
      <div class="fp-header">
        <div class="fp-title">${p.title}</div>
        <span class="fp-cat">${p.category}</span>
      </div>
      <div class="fp-content">${p.content}</div>
      <div class="fp-meta">
        <span>👤 ${p.author}</span>
        <span>💬 ${p.comment_count} comments</span>
        <span>🕐 ${new Date(p.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');
}

function filterPosts(category, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (category === 'all') {
    renderPosts(allPosts);
  } else {
    renderPosts(allPosts.filter(p => p.category === category));
  }
}

function openNewPost() {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (!user) { openModal('loginModal'); return; }
  openModal('newPostModal');
}

async function submitPost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const category = document.getElementById('postCategory').value;
  if (!title || !content) { alert('Please fill in title and content.'); return; }

  await fetch('/api/forum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, category })
  });

  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  closeModal('newPostModal');
  loadPosts();
}

async function viewPost(postId) {
  currentPostId = postId;
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  document.getElementById('postDetail').innerHTML = `
    <div class="post-detail-title">${post.title}</div>
    <div class="post-detail-meta">👤 ${post.author} · ${new Date(post.created_at).toLocaleDateString()} · <span class="fp-cat">${post.category}</span></div>
    <div class="post-detail-body">${post.content}</div>
  `;

  await loadComments(postId);
  openModal('viewPostModal');
}

async function loadComments(postId) {
  try {
    const res = await fetch(`/api/forum/${postId}/comments`);
    const data = await res.json();
    const comments = data.comments || [];
    const container = document.getElementById('commentsList');

    if (comments.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;font-style:italic">No comments yet. Be the first!</p>';
      return;
    }
    container.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-author">👤 ${c.author}</div>
        <div class="comment-text">${c.content}</div>
      </div>
    `).join('');
  } catch (e) {}
}

async function submitComment() {
  const content = document.getElementById('commentInput').value.trim();
  if (!content || !currentPostId) return;

  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (!user) { openModal('loginModal'); return; }

  await fetch(`/api/forum/${currentPostId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  document.getElementById('commentInput').value = '';
  loadComments(currentPostId);
}

// Seed sample posts on first load
async function seedSamplePosts() {
  const res = await fetch('/api/forum');
  const data = await res.json();
  if (data.posts && data.posts.length === 0) {
    const samples = [
      { title: 'Best crops for Chennai terrace in summer?', content: 'I have a 60 sq ft terrace with full sunlight. What crops grow best in Chennai heat? Looking for beginner-friendly options.', category: 'Crop Tips' },
      { title: 'How to deal with aphids organically?', content: 'My tomato plants are getting attacked by aphids. Anyone have a natural remedy that actually works without chemicals?', category: 'Pest Control' },
      { title: 'My first harvest — 3.5 kg tomatoes!', content: 'After following the AI recommendations, I harvested 3.5 kg of tomatoes from my 50 sq ft balcony in the first season. EcoTerrace really works!', category: 'General' },
    ];
    for (const p of samples) {
      await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    }
    loadPosts();
  }
}

seedSamplePosts();
