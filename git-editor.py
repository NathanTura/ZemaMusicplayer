import sys

if len(sys.argv) < 2:
    sys.exit(0)

filepath = sys.argv[-1]

with open(filepath, 'r') as f:
    content = f.read()

# If this is the sequence editor file
if "pick" in content:
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith("pick") and "Step 1:" in line:
            lines[i] = line.replace("pick", "reword", 1)
    
    with open(filepath, 'w') as f:
        f.write('\n'.join(lines))
# If this is the commit message editor file
elif "Step 1: Project setup and base UI (Geez style)" in content:
    new_content = content.replace("Step 1: Project setup and base UI (Geez style)", "Initial commit: Zema Project Setup")
    with open(filepath, 'w') as f:
        f.write(new_content)
