import subprocess

cmd = "gh pr list --base harshit-rathore3-patch-9"
output =  subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
return_code = output.returncode
error = output.stderr
output = output.stdout
print("output ")
print(output)
print(type(output))
print("error", error)
print("return code", return_code)
pr_numbers = []
if output:
    # Split the output into lines
    lines = output.strip().split('\n')

    # Extract PR numbers from the first column
    pr_numbers = [line.split()[0] for line in lines]
else:
    print("no PR raised to this branch")

for pr_number in pr_numbers:
    subprocess.run(f"gh pr close {pr_number}")
print(pr_numbers)