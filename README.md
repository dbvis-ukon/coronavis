> Please read this document carefully as it is the starter for your practical exercises.

# Forking
> Note: You only need to do this once. After you have your fork you will continue working on it during the semester.

1. Please fork this project so you'll have your own repository. Each group only needs one.
    [Click here to fork this project](https://git.uni-konstanz.de/rita-sevastjanova/docana1819/forks/new)
2. Set your fork to `Private` and grant the following people `Developer` access to the project:
    - Rita Sevastjanova
    - Fabian Sperrle
    - Your partner (can also have `Master` access if you wish)
3. Write the name of your partner into the description of the project.

# Keep your project up to date!
We will continuously extend this project so you will have to update your forks. Git offers a convenient way to do so: `merging`:
## First time
You will have to add another remote repository which refers to this project.
```shell
git remote add -f tutorium git@git.uni-konstanz.de:daniel.seebacher/gis-ws-19-20.git
```
Now you have 2 remote repositories. Your own is called `origin`, the remote repository of the tutorium is called `tutorium`.

## Merging
You need to do this on constant basis to update and sync your own project with our project. We will provide you with libraries and example code to help you with your assignments.
To merge our code into your project:
```shell
git fetch --all
git status
#SHOULD OUTPUT:
#On branch master
#Your branch is up to date with 'origin/master'.
#
#nothing to commit, working tree clean


git merge tutorium/master
```
Of course you may also use your favorite IDE/GUI tool to do this.
> Be advised that you should not switch branches to the tutorium master branch. You will have no privileges to push onto this branch.

> If you run into merge conflicts make sure you resolve them!

# Questions?
Please send us an e-mail: 
- Daniel Seebacher <daniel.seebacher@uni.kn>
- Tom Polk <thomas.polk@uni.kn> 