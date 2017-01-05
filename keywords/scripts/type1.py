'''
For generating type 1 keywords of the form: <degree_type> + <subject>
'''

# Add in more variations later
degree_types = ['bachelor\'s degree in', 'master\'s degree in', 'phd in']

with open('../type1.txt', 'w') as of:
    with open('../subjects2.txt') as ifile:
        subjects = ifile.readlines()
        for degree_type in degree_types:
            for subject in subjects:
                of.write(degree_type + ' ' + subject)

