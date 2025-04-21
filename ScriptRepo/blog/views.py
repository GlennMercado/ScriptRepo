from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import User
from django.views.generic import (
    ListView,
    DetailView,
    CreateView,
    UpdateView,
    DeleteView
)
from .models import Post

from django.core.mail import get_connection
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, requests
from django.core.mail import send_mail
from transformers import AutoModelForCausalLM, AutoTokenizer
from django.core.paginator import Paginator, EmptyPage
from django.template.loader import render_to_string
from django.urls import reverse_lazy

def check_smtp_connection(request):
    try:
        # Establish a connection
        connection = get_connection()
        connection.open()  # Explicitly open the connection
        
        # If no exception is raised, the connection was successful
        return HttpResponse("SMTP connection successful!")
    except Exception as e:
        # Catch and display the error
        return HttpResponse(f"SMTP connection failed: {e}")

    #try:
        # Sending the email
        #send_mail(
            #subject='Test Email',                       # Email subject
            #message='Hello! This is a test email.',     # Email body
            #from_email='albert.s.dimaculangan@reedelsevier.com',        # Sender's email
            #recipient_list=['albert.s.dimaculangan@reedelsevier.com'],   # List of recipients
            #fail_silently=False,                        # Raise errors if sending fails
        #)
        #return HttpResponse("Email sent successfully!")
    #except Exception as e:
        #return HttpResponse(f"Failed to send email: {e}")

def about(request):
    return render(request, 'blog/about.html', {'title': 'About'})

def home(request):
    context = {
        'posts': Post.objects.all()
    }
    return render(request, 'blog/home.html', context)

class PostListView(ListView):
    model = Post
    template_name = 'blog/home.html'  # <app>/<model>_<viewtype>.html
    context_object_name = 'posts'
    ordering = ['-date_posted']
    paginate_by = 5

class PostDetailView(DetailView):
    model = Post

class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    fields = ['title', 'content', 'Sample_Template']

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('blog-home')

class UserPostListView(ListView):
    model = Post
    template_name = 'blog/user_posts.html'  # <app>/<model>_<viewtype>.html
    context_object_name = 'posts'
    paginate_by = 5

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs.get('username'))
        return Post.objects.filter(author=user).order_by('-date_posted')
    
class PostUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Post
    fields = ['title', 'content', 'Sample_Template']

    def form_valid(self, form):
        form.instance.author = form.instance.author #self.request.user
        return super().form_valid(form)

    def test_func(self):
        post = self.get_object()
        if self.request.user == post.author or self.request.user.is_superuser:
            return True
        return False

class PostDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Post
    success_url = '/ScriptRepository'

    def test_func(self):
        post = self.get_object()
        if self.request.user == post.author or self.request.user.is_superuser:
            return True
        return False
    
@csrf_exempt
def explain_code(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            code = data.get("code", "").strip()

            if not code:
                return JsonResponse({"explanation": "No code provided for explanation."}, status=400)

            # Call the AI to generate an explanation
            explanation = generate_ai_explanation(code)

            return JsonResponse({"explanation": explanation})

        except json.JSONDecodeError:
            return JsonResponse({"explanation": "Invalid request format."}, status=400)

    return JsonResponse({"explanation": "Invalid request method."}, status=405)

def generate_ai_explanation(code):
    try:
        # Hugging Face API endpoint for StarCoder
        API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder"
        headers = {"Authorization": "Bearer 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"}

        # Prepare the input prompt
        prompt = f"Explain the code or this pseudo does in simple terms:\n\n{code}"
        payload = {"inputs": prompt, "max_new_tokens": 100}

        # Send the request to the API
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()

        # Extract the explanation
        explanation = response.json()[0]['generated_text']
        explanation = explanation.replace(prompt, "").strip()
        return explanation
    except Exception as e:
        return f"An error occurred: {str(e)}"
    
def search_posts(request):
    query = request.GET.get('q', '')
    if query:
        posts = Post.objects.filter(title__icontains=query)
    else:
        posts = Post.objects.none()
    
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Return JSON response for AJAX requests (auto-suggestions)
        data = [{'title': post.title, 'url': post.get_absolute_url()} for post in posts]
        return JsonResponse(data, safe=False)
    
    # Render the search results page for non-AJAX requests
    return render(request, 'blog/home.html', {'posts': posts, 'query': query})

# Load posts
# def load_posts(request):
#     try:
#         page_number = int(request.GET.get('page', 2))  
#         posts = Post.objects.all().order_by('-date_posted')  

#         paginator = Paginator(posts, 5)  # 🔹 Load 5 posts at a time
#         page_obj = paginator.get_page(page_number)  

#         # Render each post as an HTML snippet
#         post_snippets = [render_to_string('blog/post_snippet.html', {'post': post}) for post in page_obj]

#         return JsonResponse({
#             'posts': post_snippets,
#             'has_next': page_obj.has_next(),  
#         })
#     except Exception as e:
#         print(f"Error in load_posts view: {e}")
#         return JsonResponse({'error': 'An error occurred while loading posts.'}, status=500)