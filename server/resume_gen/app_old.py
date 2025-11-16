from flask import Flask, request, send_file
from flask_cors import CORS
from jinja2 import Environment
import requests
import os
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Use LaTeX.Online API for cloud compilation
LATEX_API_URL = "https://latexonline.cc/compile"

def escape_latex(text):
    """Escape special LaTeX characters"""
    if not isinstance(text, str):
        return text
    
    # Replace special characters
    replacements = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}',
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    return text

def escape_data(data):
    """Recursively escape LaTeX special characters in data structure"""
    if isinstance(data, str):
        return escape_latex(data)
    elif isinstance(data, dict):
        return {key: escape_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [escape_data(item) for item in data]
    else:
        return data

@app.route("/generate", methods=["POST"])
def generate_resume():
    data = request.json
    
    # Create a temporary directory for compilation
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Jinja2 LaTeX template with custom delimiters to avoid conflicts with LaTeX
        template_path = os.path.join(os.path.dirname(__file__), "resume_template.tex")
        
        # Create Jinja2 environment with custom delimiters
        env = Environment(
            block_start_string='((*',
            block_end_string='*))',
            variable_start_string='(((',
            variable_end_string=')))',
            comment_start_string='((#',
            comment_end_string='#))'
        )
        
        with open(template_path, 'r', encoding='utf-8') as f:
            tex_template = env.from_string(f.read())

        # Escape LaTeX special characters in the data
        escaped_data = {
            "summary": escape_latex(data.get("summary", "")),
            "work_experience": escape_data(data.get("work_experience", [])),
            "projects": escape_data(data.get("projects", [])),
            "skills": escape_data(data.get("skills", []))
        }

        # Render the template with the escaped data
        tex_content = tex_template.render(**escaped_data)
        
        # Write to temp directory
        tex_file = os.path.join(temp_dir, "output.tex")
        with open(tex_file, "w", encoding='utf-8') as f:
            f.write(tex_content)

        # Compile LaTeX to PDF (run twice for proper formatting)
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "output.tex"],
            cwd=temp_dir,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Run again for references
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "output.tex"],
            cwd=temp_dir,
            check=False,  # Don't fail if second pass has warnings
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        pdf_file = os.path.join(temp_dir, "output.pdf")
        
        if not os.path.exists(pdf_file):
            raise FileNotFoundError("PDF generation failed")
        
        return send_file(pdf_file, as_attachment=True, download_name="resume.pdf", mimetype="application/pdf")
    
    except subprocess.CalledProcessError as e:
        error_msg = f"LaTeX compilation failed: {e.stderr.decode('utf-8') if e.stderr else str(e)}"
        print(error_msg)
        return {"error": "LaTeX compilation failed", "details": error_msg}, 500
    except Exception as e:
        error_msg = f"Failed to generate PDF: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return {"error": "Failed to generate PDF", "details": error_msg}, 500
    finally:
        # Clean up temp directory after a delay to allow file to be sent
        # Commenting out for debugging - uncomment after testing
        # try:
        #     shutil.rmtree(temp_dir)
        # except:
        #     pass
        pass

@app.route("/generate-cover-letter", methods=["POST"])
def generate_cover_letter():
    data = request.json
    
    # Create a temporary directory for compilation
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Jinja2 LaTeX template with custom delimiters to avoid conflicts with LaTeX
        template_path = os.path.join(os.path.dirname(__file__), "cover_letter_template.tex")
        
        # Create Jinja2 environment with custom delimiters
        env = Environment(
            block_start_string='((*',
            block_end_string='))',
            variable_start_string='(((',
            variable_end_string=')))',
            comment_start_string='((#',
            comment_end_string='#))'
        )
        
        with open(template_path, 'r', encoding='utf-8') as f:
            tex_template = env.from_string(f.read())

        # Escape LaTeX special characters in the data
        escaped_data = {
            "date": data.get("date", ""),
            "company_name": escape_latex(data.get("company_name", "")),
            "body": escape_latex(data.get("body", ""))
        }

        # Render the template with the escaped data
        tex_content = tex_template.render(**escaped_data)
        
        # Write to temp directory
        tex_file = os.path.join(temp_dir, "cover_letter.tex")
        with open(tex_file, "w", encoding='utf-8') as f:
            f.write(tex_content)

        # Compile LaTeX to PDF (run twice for proper formatting)
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "cover_letter.tex"],
            cwd=temp_dir,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Run again for references
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "cover_letter.tex"],
            cwd=temp_dir,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        pdf_file = os.path.join(temp_dir, "cover_letter.pdf")
        
        if not os.path.exists(pdf_file):
            raise FileNotFoundError("PDF generation failed")
        
        return send_file(pdf_file, as_attachment=True, download_name="cover_letter.pdf", mimetype="application/pdf")
    
    except subprocess.CalledProcessError as e:
        error_msg = f"LaTeX compilation failed: {e.stderr.decode('utf-8') if e.stderr else str(e)}"
        print(error_msg)
        return {"error": "LaTeX compilation failed", "details": error_msg}, 500
    except Exception as e:
        error_msg = f"Failed to generate PDF: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return {"error": "Failed to generate PDF", "details": error_msg}, 500
    finally:
        pass

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)