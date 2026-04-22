import sys

config_path = sys.argv[1]
with open(config_path, 'r') as f:
    lines = f.readlines()

new_block = [
    "    location /rachma-lite {\n",
    "        alias /home/debian/coffeshop/apps/rachma-lite/;\n",
    "        index index.html;\n",
    "        try_files $uri $uri/ /rachma-lite/index.html =404;\n",
    "    }\n\n"
]

out_lines = []
inserted = False
for line in lines:
    if 'location / {' in line and not inserted:
        out_lines.extend(new_block)
        inserted = True
    out_lines.append(line)

with open(config_path, 'w') as f:
    f.writelines(out_lines)
