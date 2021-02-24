from os.path import abspath, dirname, join


class lut_generator():

    def __init__(self, mavlink_file, version):
        self.mav_file = mavlink_file
        self.abs_path = dirname(abspath(self.mav_file))
        self.definitions = {}
        self.version = str(version)
        print(self.abs_path)

    def generate_file(self):
        self.get_values()
        self.generate_str_to_id_lut()
        self.generate_id_to_cmd_lut()
        with open(join(self.abs_path, 'mavlink.lut.js'), 'w') as lut_file:
            lut_file.write(self.str_to_id)
            lut_file.write(self.id_to_cmd)
            lut_file.write('module.exports = {mavID, mavCmd};')

    def get_values(self):
        with open(self.mav_file, 'r') as mav_file:
            for line in mav_file:
                values = self.extract_def(line)
                if values is not None:
                    self.definitions[values[0]] = values[-1]

    def generate_str_to_id_lut(self):
        self.str_to_id = "const mavID = {"
        for key, value in self.definitions.items():
            self.str_to_id += '\'{}\': {},\n'.format(key, value)
        self.str_to_id += "};\n"

    def extract_def(self, line: str):
        if not self.valid_line(line):
            return None
        enum, value = line.split('//')[0].split('.')[-1].split('=')
        return (enum.strip(), value.strip())

    def valid_line(self, line):
        return line.startswith('mavlink' + self.version) \
         and (line.find('.MAV') != -1)

    def generate_id_to_cmd_lut(self):
        self.id_to_cmd = "const mavCmd = {"
        for key, value in self.definitions.items():
            if key.startswith('MAV_CMD_'):
                self.id_to_cmd += '\'{}\': \'{}\',\n'.format(value, key)
        self.id_to_cmd += "};\n"


gen = lut_generator('./mavlink_v1/mavlink.js', 1)
gen.generate_file()
