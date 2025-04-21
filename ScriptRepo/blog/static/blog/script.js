document.addEventListener('DOMContentLoaded', function() {
    const collapseElement = document.getElementById('expand');
    const chevronIcon = document.querySelector('[data-bs-target="#expand"] .fa-chevron-down');

    collapseElement.addEventListener('show.bs.collapse', function () {
        chevronIcon.classList.remove('fa-chevron-down');
        chevronIcon.classList.add('fa-chevron-up');
    });

    collapseElement.addEventListener('hide.bs.collapse', function () {
        chevronIcon.classList.remove('fa-chevron-up');
        chevronIcon.classList.add('fa-chevron-down');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Select all copy buttons
    const copyButtons = document.querySelectorAll('.copy-code-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Find the closest <pre><code> element
            const codeBlock = button.closest('.media-body').querySelector('pre code');
            const codeText = codeBlock.innerText;

            // Copy the code to the clipboard
            navigator.clipboard.writeText(codeText).then(() => {
                // Optional: Provide feedback to the user
                button.innerHTML = '<i class="fas fa-check"></i>'; // Change icon to checkmark
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>'; // Revert icon after 2 seconds
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        });
    });
});

// JavaScript to Toggle Menu on Mobile
document.getElementById('profileMenu').addEventListener('click', function (e) {
    e.preventDefault();
    const menuContent = document.getElementById('profileMenuContent');
    if (menuContent.style.display === 'block') {
        menuContent.style.display = 'none';
    } else {
        menuContent.style.display = 'block';
    }
});

// AI explain script
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".ai-explain-button").forEach(button => {
        button.addEventListener("click", function () {
            let codeContent = this.getAttribute("data-code");

            if (!codeContent.trim()) {
                alert("No code available for explanation.");
                return;
            }

            // Show modal and set loading text
            let modal = new bootstrap.Modal(document.getElementById("aiExplainModal"));
            document.getElementById("aiExplainContent").innerText = "Loading...";
            modal.show();

            // API Call to Explain Code
            fetch("/ScriptRepository/explain-code/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(), 
                },
                body: JSON.stringify({ code: codeContent })
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("aiExplainContent").innerText = data.explanation;
            })
            .catch(error => {
                document.getElementById("aiExplainContent").innerText = "An error occurred.";
                console.error("Error:", error);
            });
        });
    });
});

// Function to get CSRF token from cookies
function getCSRFToken() {
    let cookieValue = null;
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith("csrftoken=")) {
            cookieValue = cookie.substring("csrftoken=".length, cookie.length);
            break;
        }
    }
    return cookieValue;
}

// Search bar
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDropdown = document.getElementById('suggestions');

    searchInput.addEventListener('input', function () {
        const query = this.value;
        if (query.length > 2) { // Only fetch suggestions after 3 characters
            fetch(`/ScriptRepository/search/?q=${query}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                suggestionsDropdown.innerHTML = ''; // Clear previous suggestions
                data.forEach(item => {
                    const suggestion = document.createElement('a');
                    suggestion.href = item.url;
                    suggestion.textContent = item.title;
                    suggestion.classList.add('dropdown-item');
                    suggestionsDropdown.appendChild(suggestion);
                });
                suggestionsDropdown.style.display = data.length ? 'block' : 'none';
            });
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.matches('#searchInput')) {
            suggestionsDropdown.style.display = 'none';
        }
    });
});

// Infinite scroll
// document.addEventListener('DOMContentLoaded', function () {
//     let page = 2;  // Start from page 2
//     let isLoading = false;
//     let hasNextPage = true;

//     const postsContainer = document.getElementById('posts-container');
//     const loadingSpinner = document.getElementById('loading-spinner');

//     if (!postsContainer || !loadingSpinner) {
//         console.error('Required elements not found');
//         return;
//     }

//     function loadMorePosts() {
//         if (isLoading || !hasNextPage) return;
//         isLoading = true;

//         // Show loading spinner before fetching new posts
//         loadingSpinner.classList.remove('d-none');

//         setTimeout(() => {
//             fetch(`/ScriptRepository/load-posts/?page=${page}`)
//                 .then(response => {
//                     if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//                     return response.json();
//                 })
//                 .then(data => {
//                     console.log("Appending posts:", data.posts);
                
//                     if (data.posts && data.posts.length > 0) {
//                         const fragment = document.createDocumentFragment();
//                         const newPosts = [];

//                         data.posts.forEach(postHtml => {
//                             const tempDiv = document.createElement("div");
//                             tempDiv.innerHTML = postHtml;
//                             const newPost = tempDiv.querySelector(".post-content");

//                             if (newPost) {
//                                 newPost.classList.add("d-none"); // Hide new posts initially
//                                 newPosts.push(newPost);
//                                 fragment.appendChild(newPost);
//                             } else {
//                                 console.error("Invalid post HTML:", postHtml);
//                             }
//                         });

//                         postsContainer.appendChild(fragment);
//                         page++;

//                         // Ensure Prism.js re-applies syntax highlighting
//                         setTimeout(() => {
//                             newPosts.forEach(post => post.classList.remove("d-none"));
//                             Prism.highlightAll(); // Reapply syntax highlighting
//                         }, 500);
//                     } else {
//                         console.warn("No new posts received.");
//                         hasNextPage = false;
//                     }
                
//                     if (!data.has_next) {
//                         console.log("No more posts to load.");
//                         hasNextPage = false;
//                         window.removeEventListener("scroll", onScroll);
//                     }
//                 })
//                 .catch(error => console.error("Error loading posts:", error))
//                 .finally(() => {
//                     // Only hide spinner AFTER new posts are fully revealed
//                     setTimeout(() => {
//                         loadingSpinner.classList.add('d-none');
//                         isLoading = false;
//                     }, 1000);
//                 });
//         }, 300); // Small delay before fetching to ensure spinner visibility
//     }

//     function onScroll() {
//         if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
//             console.log("Scrolled to bottom, loading more posts...");
//             loadMorePosts();
//         }
//     }

//     window.addEventListener('scroll', onScroll);
// });

// Skeleton loader
document.addEventListener('DOMContentLoaded', function () {
    const skeletonLoaders = document.querySelectorAll('#skeleton-loader');
    const posts = document.querySelectorAll('.post-content');

    if (skeletonLoaders.length && posts.length) {
        skeletonLoaders.forEach(loader => loader.classList.remove('d-none'));

        setTimeout(() => {
            skeletonLoaders.forEach(loader => loader.classList.add('d-none'));
            posts.forEach(post => post.classList.remove('d-none'));
        }, 500);  // 1-second delay
    }
});
