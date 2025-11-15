from flask import Flask, request, send_file
from jinja2 import Template
import subprocess
import os

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate_resume():
    data = request.json  # e.g. {"name": "Yong Ray", "education": "...", ...}

    # Jinja2 LaTeX template
    with open("resume_template.tex") as f:
        tex_template = Template(f.read())

    tex_content = tex_template.render(work_experience=data["work_experience"], projects=data["projects"], skills=data["skills"])
    with open("results/output.tex", "w") as f:
        f.write(tex_content)

    # Compile LaTeX to PDF
    subprocess.run(["pdflatex", "results/output.tex"], check=True)
    return send_file("results/resume.pdf", as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)