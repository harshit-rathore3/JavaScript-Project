
import os
import subprocess
import traceback
from typing import List

from utils.utils import handle_exception, run_terminal_commands


class GitHubUtils:
    """
    A utility class for handling various GitHub operations such as cloning repositories,
    checking out branches, committing changes, and more.
    """
    def __init__(self, urls: list, path=os.getcwd()) -> None:
        """
        Initialize the GitHubUtils object.

        Args:
            urls (list): A list of repository URLs to clone.
            path (str, optional): The path to the directory where the repositories should be cloned. Defaults to None.
        """
        try:
            self.urls = urls

            git_initialization = ['git config --global core.longpaths true',
                                  'git config --global user.name "Harshit Rathore"',
                                  'git config --global user.email "harshit.rathore@techolution.com"',
                                  ]
            run_terminal_commands(cmd_list=git_initialization)
            # TODO : set git credentials as well either here or in config

            self.path = os.path.join(os.getcwd(), "Repos")
            if os.path.exists(self.path):
                self.remove_repo()
            os.mkdir(self.path)
            os.chdir(self.path)
            for url in self.urls:
                run_terminal_commands(cmd=f"git clone {url}")
        except Exception as e:
            data = {
                "urls": urls,
                "path": path
            }
            handle_exception("Error in GitHubUtils Constructor", data, e, traceback.print_exc(), error_code=0)


    def get_files_changed(self, commit_id: str) -> List[str]:
        """
        Get the list of files changed in a specific commit.

        Args:
            commit_id (str): The ID of the commit.

        Returns:
            list: A list of file paths that were changed in the commit.
        """
        try:
            cmd = f'git diff-tree --no-commit-id --name-only -r {commit_id}'
            cmd_run = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True, check=False)
            return cmd_run.stdout.split('\n')[:-1]
        except subprocess.CalledProcessError as e:
            data = {'commit id': commit_id}
            handle_exception("Error while fetching changed files list with commit id", data, e, traceback.print_exc(), error_code=0)
        except Exception as e:
            data = {'commit id': commit_id}
            handle_exception("Error while fetching changed files list with commit id", data, e, traceback.print_exc(), error_code=0)


    def git_checkout_and_pull(self, branch_name: str) -> None:
        """
        Checkout to a specific branch and pull the latest changes.

        Args:
            branch_name (str): The name of the branch.
        """
        try:
            commands = [f'git checkout {branch_name}', 'git pull']
            run_terminal_commands(cmd_list=commands)
        except Exception as e:
            data = {'branch name': branch_name}
            handle_exception("Error while git checkout and pull", data, e, traceback.print_exc(), error_code=0)


    def git_add_commit(self, msg: str) -> None:
        """
        Add all changes to the staging area and commit them.

        Args:
            msg (str): The commit message.
        """
        try:
            commands = ['git add .', f'git commit -m "{msg}"']
            run_terminal_commands(cmd_list=commands)
        except Exception as e:
            data = {"commit msg": msg}
            handle_exception("Error while git commit", data, e, traceback.print_exc(), error_code=0)


    def pull_push(self) -> None:
        """
        Pull the latest changes from the remote repository and push local changes.
        """
        try:
            commands = ['git pull', 'git push']
            run_terminal_commands(cmd_list=commands)
        except Exception as e:
            handle_exception("Error while git pull and push", {}, e, traceback.print_exc(), error_code=0)


    def get_files_to_ignore(self, commit_msg: str) -> list:
        """
        Parse the commit message to find any files that should be ignored.

        Args:
            commit_msg (str): The commit message.

        Returns:
            list: A list of file paths to ignore.
        """
        try:
            flag = '--skip'
            flag_ind = commit_msg.find(flag)
            if flag_ind != -1:
                content_after_skip = commit_msg[flag_ind + len(flag):].strip()
                return content_after_skip.split(' ')
            return []
        except Exception as e:
            data = {'commit msg': commit_msg}
            handle_exception("Error while parsing skip flag", data, e, traceback.print_exc(), error_code=0)
            return []


    def remove_repo(self) -> bool:
        """
        Remove the cloned repository.

        Returns:
            bool: True if the repository was successfully removed, False otherwise.
        """
        try:
            if os.path.exists(self.path):
                os.chdir(os.path.abspath(os.path.join(self.path, os.pardir)))
                if os.name == 'nt':
                    run_terminal_commands(cmd_list=[f'rmdir /S /Q "{self.path}"'])
                else:
                    run_terminal_commands(cmd_list=['whoami', 'ls', f'rm -rf {self.path}'])
                return True
            return False
        except Exception as e:
            data = {'repo_path': self.path}
            handle_exception("Error in removing repo", data, e, traceback.print_exc(), error_code=0)
            return False
